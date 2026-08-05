#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
验证码自动识别与解决模块
========================
支持多种验证码类型，自动检测并调用对应的识别策略。

支持类型:
  1. 文字/数字验证码 (Text CAPTCHA)   —— ddddocr OCR 识别
  2. 算术验证码 (Math CAPTCHA)        —— OCR 识别 + 表达式求值
  3. 点选验证码 (Click CAPTCHA)       —— ddddocr 目标检测 + 坐标点击
  4. 滑块验证码 (Slide CAPTCHA)       —— ddddocr 缺口检测 + 轨迹模拟
  5. reCAPTCHA v2/v3                 —— 第三方打码平台 (2captcha/capsolver)
  6. hCaptcha                        —— 第三方打码平台
  7. Cloudflare Turnstile            —— 第三方打码平台
  8. FunCaptcha                      —— 第三方打码平台

技术参考:
  - ddddocr: https://github.com/sml2h3/ddddocr (开源 OCR + 目标检测 + 滑块)
  - 2captcha: https://2captcha.com (商业打码平台)
  - capsolver: https://capsolver.com (商业打码平台)
  - yescaptcha: https://yescaptcha.com (商业打码平台)

合规提醒：本模块仅供技术研究和学习使用，请在合法合规的前提下使用。
"""

import re
import time
import json
import base64
import logging
import random
import math
from enum import Enum
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any, Tuple, Union
from io import BytesIO

# ---------------------------------------------------------------------------
# 日志
# ---------------------------------------------------------------------------
logger = logging.getLogger("captcha_solver")
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter(
        "[%(asctime)s] [CAPTCHA] %(levelname)s: %(message)s",
        datefmt="%H:%M:%S"
    ))
    logger.addHandler(handler)
logger.setLevel(logging.INFO)


# ===========================================================================
# 枚举与数据结构
# ===========================================================================
class CaptchaType(Enum):
    """验证码类型"""
    UNKNOWN = "unknown"
    TEXT = "text"                    # 文字/数字验证码
    MATH = "math"                    # 算术验证码 (3+5=?)
    CLICK_OBJECT = "click_object"    # 点选目标 (点击图中所有红绿灯)
    CLICK_ORDER = "click_order"      # 顺序点选 (按文字顺序点击)
    SLIDE = "slide"                  # 滑块验证码
    RECAPTCHA_V2 = "recaptcha_v2"   # Google reCAPTCHA v2
    RECAPTCHA_V3 = "recaptcha_v3"   # Google reCAPTCHA v3
    HCAPTCHA = "hcaptcha"            # hCaptcha
    HCAPTCHA_GRID = "hcaptcha_grid" # hCaptcha 九宫格图片分类
    TURNSTILE = "turnstile"          # Cloudflare Turnstile
    FUNCAPTCHA = "funcaptcha"        # FunCaptcha / Arkose Labs
    GEETEST = "geetest"              # 极验验证码 (滑块/点选/文字)
    GEETEST_V4 = "geetest_v4"        # 极验第四代
    AWS_WAF = "aws_waf"              # AWS WAF 验证码
    IMAGE_CLASSIFY = "image_classify"  # 通用图片分类


@dataclass
class CaptchaResult:
    """验证码识别结果"""
    success: bool = False
    captcha_type: CaptchaType = CaptchaType.UNKNOWN
    answer: Any = None               # 文字验证码: str; 点选: List[Tuple]; 滑块: int(距离)
    details: Dict[str, Any] = field(default_factory=dict)
    error: str = ""


# ===========================================================================
# 验证码类型检测器
# ===========================================================================
class CaptchaDetector:
    """
    从页面 HTML / 元素特征中自动检测验证码类型。

    检测策略:
      - HTML 结构特征 (iframe src, class name, data-sitekey)
      - 图片特征 (图片尺寸、内容模式)
      - 页面文本特征 ("请输入计算结果", "请依次点击")
    """

    # reCAPTCHA 特征
    RECAPTCHA_PATTERNS = [
        r"recaptcha",
        r"google.*recaptcha",
        r"data-sitekey",
        r"grecaptcha",
    ]

    # hCaptcha 特征
    HCAPTCHA_PATTERNS = [
        r"hcaptcha",
        r"h-captcha",
        r"data-hcaptcha",
    ]

    # Turnstile 特征
    TURNSTILE_PATTERNS = [
        r"cf-turnstile",
        r"challenges\.cloudflare\.com/turnstile",
        r"turnstile",
    ]

    # FunCaptcha 特征
    FUNCAPTCHA_PATTERNS = [
        r"funcaptcha",
        r"arkoselabs",
        r"arkose",
    ]

    # 算术验证码特征
    MATH_PATTERNS = [
        r"\d+\s*[+\-*/×÷]\s*\d+\s*=\s*\?",
        r"\d+\s*[+\-*/×÷]\s*\d+\s*=\s*_",
        r"计算.*结果",
        r"算.*等于",
    ]

    # 点选验证码特征
    CLICK_PATTERNS = [
        r"请.*点击",
        r"依次点击",
        r"按.*顺序.*点击",
        r"click.*in.*order",
        r"click.*all",
    ]

    # 滑块验证码特征
    SLIDE_PATTERNS = [
        r"slider",
        r"slide.*verify",
        r"拖动.*滑块",
        r"nc_iconfont",
        r"geetest",
        r"gt_slider",
    ]

    # GeeTest 极验验证码特征
    GEETEST_PATTERNS = [
        r"geetest",
        r"gt_",
        r"gee4",
        r"captcha\.geetest",
        r"api\.geetest",
    ]

    # AWS WAF 验证码特征
    AWS_WAF_PATTERNS = [
        r"awswaf",
        r"aws.*waf",
        r"captcha\.awswaf",
        r"challenge\.awswaf",
    ]

    @classmethod
    def detect_from_html(cls, html: str) -> CaptchaType:
        """从页面 HTML 检测验证码类型"""
        if not html:
            return CaptchaType.UNKNOWN

        html_lower = html.lower()

        # 按特异性优先检测
        # 顺序: Turnstile → hCaptcha → FunCaptcha → AWS WAF → GeeTest → reCAPTCHA
        # （data-sitekey 是通用属性，先匹配更具体的特征）

        # Turnstile（先于 reCAPTCHA，因为也用 data-sitekey）
        for pattern in cls.TURNSTILE_PATTERNS:
            if re.search(pattern, html_lower):
                return CaptchaType.TURNSTILE

        # hCaptcha
        for pattern in cls.HCAPTCHA_PATTERNS:
            if re.search(pattern, html_lower):
                return CaptchaType.HCAPTCHA

        # FunCaptcha
        for pattern in cls.FUNCAPTCHA_PATTERNS:
            if re.search(pattern, html_lower):
                return CaptchaType.FUNCAPTCHA

        # AWS WAF
        for pattern in cls.AWS_WAF_PATTERNS:
            if re.search(pattern, html_lower):
                return CaptchaType.AWS_WAF

        # GeeTest (需要在 reCAPTCHA 之前检测，因为 GeeTest 也可能用 data-sitekey)
        for pattern in cls.GEETEST_PATTERNS:
            if re.search(pattern, html_lower):
                # 区分 v4
                if "gee4" in html_lower or "geetest_v4" in html_lower:
                    return CaptchaType.GEETEST_V4
                return CaptchaType.GEETEST

        # reCAPTCHA（排除 Turnstile/hCaptcha/GeeTest 后再匹配）
        for pattern in cls.RECAPTCHA_PATTERNS:
            if re.search(pattern, html_lower):
                # 区分 v2 / v3
                if "grecaptcha.execute" in html_lower or "v3" in html_lower:
                    return CaptchaType.RECAPTCHA_V3
                return CaptchaType.RECAPTCHA_V2

        # 算术验证码
        for pattern in cls.MATH_PATTERNS:
            if re.search(pattern, html_lower):
                return CaptchaType.MATH

        # 点选验证码
        for pattern in cls.CLICK_PATTERNS:
            if re.search(pattern, html_lower):
                # 区分顺序点选和目标点选
                if "顺序" in html_lower or "order" in html_lower or "依次" in html_lower:
                    return CaptchaType.CLICK_ORDER
                return CaptchaType.CLICK_OBJECT

        # 滑块验证码
        for pattern in cls.SLIDE_PATTERNS:
            if re.search(pattern, html_lower):
                return CaptchaType.SLIDE

        return CaptchaType.UNKNOWN

    @classmethod
    def detect_from_image(cls, image_bytes: bytes) -> CaptchaType:
        """
        从验证码图片内容检测类型。
        基于图片特征启发式判断（尺寸、内容模式）。
        """
        try:
            from PIL import Image
            img = Image.open(BytesIO(image_bytes))
            w, h = img.size

            # 极小图片 (图标) → 可能是滑块缺口
            if w < 100 and h < 100:
                return CaptchaType.SLIDE

            # 宽幅图片 (通常点选验证码较宽)
            if w > 300 and h > 100:
                return CaptchaType.CLICK_OBJECT

            # 正方形或接近正方形 → 可能是点选
            if 0.8 < w / h < 1.2 and w > 150:
                return CaptchaType.CLICK_OBJECT

            # 小尺寸 → 文字验证码
            if w < 200 and h < 80:
                return CaptchaType.TEXT

            return CaptchaType.UNKNOWN

        except Exception:
            return CaptchaType.UNKNOWN


# ===========================================================================
# 策略 1: 文字/数字验证码识别 (ddddocr OCR)
# ===========================================================================
class TextCaptchaSolver:
    """
    使用 ddddocr 识别文字/数字验证码。

    支持:
      - 纯数字验证码
      - 字母+数字验证码
      - 中文验证码
      - 带干扰线的验证码
    """

    def __init__(self, use_beta: bool = False, use_gpu: bool = False):
        self.ocr = None
        self.use_beta = use_beta
        self.use_gpu = use_gpu

    def _init_ocr(self):
        """延迟初始化 ddddocr（首次调用时加载模型）"""
        if self.ocr is not None:
            return
        try:
            import ddddocr
            self.ocr = ddddocr.DdddOcr(
                ocr=True,
                det=False,
                beta=self.use_beta,
                use_gpu=self.use_gpu,
                show_ad=False,
            )
            logger.info("ddddocr OCR 模型已加载")
        except ImportError:
            raise ImportError("ddddocr 未安装 (pip install ddddocr)")

    def solve(self, image_bytes: bytes, charset: str = "") -> CaptchaResult:
        """
        识别文字验证码。

        :param image_bytes: 验证码图片二进制数据
        :param charset:     限制字符集，如 "0123456789" 或 "" 自动
        :return: CaptchaResult，answer 为识别出的字符串
        """
        try:
            self._init_ocr()

            # 设置字符范围
            if charset:
                self.ocr.set_ranges(charset)
            else:
                self.ocr.set_ranges(6)  # 大小写+数字

            result = self.ocr.classification(image_bytes)

            if result and len(result) > 0:
                return CaptchaResult(
                    success=True,
                    captcha_type=CaptchaType.TEXT,
                    answer=result,
                    details={"raw": result, "length": len(result)},
                )
            else:
                return CaptchaResult(
                    success=False,
                    captcha_type=CaptchaType.TEXT,
                    error="OCR 返回空结果",
                )

        except Exception as e:
            return CaptchaResult(
                success=False,
                captcha_type=CaptchaType.TEXT,
                error=f"文字验证码识别异常: {e}",
            )

    def solve_with_probability(self, image_bytes: bytes) -> CaptchaResult:
        """
        带概率输出的识别（可用于多候选选择）。

        :return: CaptchaResult，answer 为最可能的结果，
                 details 含 probability 分布
        """
        try:
            self._init_ocr()
            result = self.ocr.classification(image_bytes, probability=True)

            if isinstance(result, dict) and "probability" in result:
                # 从概率分布中取最优
                chars = result["charsets"]
                text = ""
                for prob_list in result["probability"]:
                    best_idx = prob_list.index(max(prob_list))
                    text += chars[best_idx]

                return CaptchaResult(
                    success=True,
                    captcha_type=CaptchaType.TEXT,
                    answer=text,
                    details={"probability": result, "raw": text},
                )
            else:
                # 非 probability 模式返回了字符串
                return CaptchaResult(
                    success=True,
                    captcha_type=CaptchaType.TEXT,
                    answer=str(result),
                )

        except Exception as e:
            return CaptchaResult(
                success=False,
                captcha_type=CaptchaType.TEXT,
                error=f"概率识别异常: {e}",
            )


# ===========================================================================
# 策略 2: 算术验证码识别 (OCR + 表达式求值)
# ===========================================================================
class MathCaptchaSolver:
    """
    识别并计算算术验证码，如 "3 + 5 = ?"、"12 × 4 = ?"

    流程: OCR 提取表达式 → 解析运算符 → 计算结果
    """

    # 运算符映射（OCR 可能识别为不同符号）
    OPERATOR_MAP = {
        "+": "+", "-": "-", "*": "*", "/": "/",
        "×": "*", "÷": "/", "x": "*", "X": "*",
        "＋": "+", "－": "-", "＝": "=",
    }

    def __init__(self, use_gpu: bool = False):
        self.text_solver = TextCaptchaSolver(use_gpu=use_gpu)

    def solve(self, image_bytes: bytes) -> CaptchaResult:
        """
        识别算术验证码并计算结果。

        :param image_bytes: 验证码图片
        :return: CaptchaResult，answer 为计算结果 (int 或 str)
        """
        try:
            # 用 OCR 识别表达式
            # 限制字符集为数字+运算符
            charset = "0123456789+-*/×÷xX=?＋－＝ "
            ocr_result = self.text_solver.solve(image_bytes, charset=charset)

            if not ocr_result.success:
                return CaptchaResult(
                    success=False,
                    captcha_type=CaptchaType.MATH,
                    error=f"OCR 识别失败: {ocr_result.error}",
                )

            expression = ocr_result.answer.strip()
            logger.info(f"算术验证码 OCR 结果: {expression}")

            # 解析并计算
            result = self._evaluate_expression(expression)

            if result is not None:
                return CaptchaResult(
                    success=True,
                    captcha_type=CaptchaType.MATH,
                    answer=result,
                    details={"expression": expression, "ocr_raw": expression},
                )
            else:
                return CaptchaResult(
                    success=False,
                    captcha_type=CaptchaType.MATH,
                    error=f"无法解析表达式: {expression}",
                    details={"ocr_raw": expression},
                )

        except Exception as e:
            return CaptchaResult(
                success=False,
                captcha_type=CaptchaType.MATH,
                error=f"算术验证码异常: {e}",
            )

    def _evaluate_expression(self, expr: str) -> Optional[Union[int, str]]:
        """
        解析并计算算术表达式。

        支持: 3+5=?、12×4=?、100-37=?、20÷4=?
        """
        # 清理空格
        expr = expr.replace(" ", "").replace("?", "").replace("？", "")

        # 移除等号后面可能的内容
        expr = expr.split("=")[0] if "=" in expr else expr

        # 统一运算符
        for wrong_op, correct_op in self.OPERATOR_MAP.items():
            if wrong_op in expr and correct_op != "=":
                expr = expr.replace(wrong_op, correct_op)

        # 提取数字和运算符
        # 匹配模式: 数字 运算符 数字
        match = re.match(r"(\d+)([+\-*/])(\d+)", expr)
        if not match:
            logger.warning(f"表达式格式不匹配: {expr}")
            return None

        a, op, b = match.groups()
        a, b = int(a), int(b)

        try:
            if op == "+":
                return a + b
            elif op == "-":
                return a - b
            elif op == "*":
                return a * b
            elif op == "/":
                if b == 0:
                    return None
                # 除法可能是整除或有余数
                if a % b == 0:
                    return a // b
                else:
                    return a / b
        except Exception:
            return None

        return None


# ===========================================================================
# 策略 3: 点选验证码识别 (ddddocr 目标检测)
# ===========================================================================
class ClickCaptchaSolver:
    """
    识别点选验证码。

    支持两种模式:
      1. 目标点选: "点击图中所有的红绿灯" → 检测目标位置
      2. 顺序点选: "按顺序点击图中的文字" → 检测 + 排序

    使用 ddddocr 的 detection 模式进行目标检测，
    返回点击坐标列表 [(x1,y1), (x2,y2), ...]
    """

    def __init__(self, use_gpu: bool = False):
        self.det = None       # 目标检测器
        self.ocr = None       # OCR（顺序点选需要）
        self.use_gpu = use_gpu

    def _init_detector(self):
        if self.det is not None:
            return
        try:
            import ddddocr
            self.det = ddddocr.DdddOcr(
                ocr=False,
                det=True,
                use_gpu=self.use_gpu,
                show_ad=False,
            )
            logger.info("ddddocr 目标检测模型已加载")
        except ImportError:
            raise ImportError("ddddocr 未安装 (pip install ddddocr)")

    def _init_ocr(self):
        if self.ocr is not None:
            return
        try:
            import ddddocr
            self.ocr = ddddocr.DdddOcr(
                ocr=True,
                det=False,
                use_gpu=self.use_gpu,
                show_ad=False,
            )
        except ImportError:
            raise ImportError("ddddocr 未安装")

    def solve_object_click(
        self,
        image_bytes: bytes,
        target_image_bytes: Optional[bytes] = None,
    ) -> CaptchaResult:
        """
        目标点选验证码: 检测图中所有目标的位置。

        :param image_bytes:       主验证码图片
        :param target_image_bytes: 目标物体的小图（如有，用于辅助匹配）
        :return: CaptchaResult，answer 为点击坐标列表 [(x,y), ...]
        """
        try:
            self._init_detector()

            # 目标检测
            bboxes = self.det.detection(image_bytes)
            # bboxes 格式: [[x1,y1,x2,y2], ...]

            if not bboxes:
                return CaptchaResult(
                    success=False,
                    captcha_type=CaptchaType.CLICK_OBJECT,
                    error="未检测到目标",
                )

            # 转换为中心点坐标
            click_points = []
            for bbox in bboxes:
                x1, y1, x2, y2 = bbox
                cx = (x1 + x2) // 2
                cy = (y1 + y2) // 2
                click_points.append((cx, cy))

            # 如果有目标参考图，尝试用 slide_match 排序
            if target_image_bytes:
                click_points = self._match_target_order(
                    image_bytes, target_image_bytes, click_points
                )

            return CaptchaResult(
                success=True,
                captcha_type=CaptchaType.CLICK_OBJECT,
                answer=click_points,
                details={
                    "bboxes": bboxes,
                    "point_count": len(click_points),
                },
            )

        except Exception as e:
            return CaptchaResult(
                success=False,
                captcha_type=CaptchaType.CLICK_OBJECT,
                error=f"点选验证码识别异常: {e}",
            )

    def solve_order_click(
        self,
        image_bytes: bytes,
        target_text: str = "",
    ) -> CaptchaResult:
        """
        顺序点选验证码: "请依次点击 '星空大海' 四个字"

        :param image_bytes: 主验证码图片
        :param target_text:  需要按顺序点击的文字（如从提示中提取）
        :return: CaptchaResult，answer 为按顺序排列的点击坐标
        """
        try:
            self._init_detector()
            self._init_ocr()

            # 检测所有文字位置
            bboxes = self.det.detection(image_bytes)

            if not bboxes:
                return CaptchaResult(
                    success=False,
                    captcha_type=CaptchaType.CLICK_ORDER,
                    error="未检测到文字",
                )

            # 裁剪每个检测区域并 OCR 识别
            from PIL import Image
            img = Image.open(BytesIO(image_bytes))

            detected_chars = []
            for bbox in bboxes:
                x1, y1, x2, y2 = bbox
                # 裁剪并识别
                cropped = img.crop((x1, y1, x2, y2))
                buf = BytesIO()
                cropped.save(buf, format="PNG")
                char = self.ocr.classification(buf.getvalue())
                detected_chars.append({
                    "char": char,
                    "bbox": bbox,
                    "center": ((x1 + x2) // 2, (y1 + y2) // 2),
                })

            logger.info(f"检测到文字: {[c['char'] for c in detected_chars]}")

            # 按 target_text 顺序排列
            if target_text:
                ordered_points = []
                remaining = list(detected_chars)
                for target_char in target_text:
                    for i, item in enumerate(remaining):
                        if item["char"] == target_char:
                            ordered_points.append(item["center"])
                            remaining.pop(i)
                            break
                if ordered_points:
                    return CaptchaResult(
                        success=True,
                        captcha_type=CaptchaType.CLICK_ORDER,
                        answer=ordered_points,
                        details={"target_text": target_text, "detected": detected_chars},
                    )

            # 无目标文字，按从左到右、从上到下排序
            detected_chars.sort(key=lambda c: (c["center"][1] // 50, c["center"][0]))
            ordered_points = [c["center"] for c in detected_chars]

            return CaptchaResult(
                success=True,
                captcha_type=CaptchaType.CLICK_ORDER,
                answer=ordered_points,
                details={"detected": detected_chars},
            )

        except Exception as e:
            return CaptchaResult(
                success=False,
                captcha_type=CaptchaType.CLICK_ORDER,
                error=f"顺序点选识别异常: {e}",
            )

    def _match_target_order(
        self,
        main_image: bytes,
        target_image: bytes,
        points: List[Tuple[int, int]],
    ) -> List[Tuple[int, int]]:
        """用目标图辅助排序点选顺序（简化版）"""
        # 这里仅返回原始顺序，实际可扩展更复杂的匹配
        return points


# ===========================================================================
# 策略 4: 滑块验证码识别 (ddddocr 缺口检测 + 轨迹模拟)
# ===========================================================================
class SlideCaptchaSolver:
    """
    识别滑块验证码的缺口位置，并生成人类滑动轨迹。

    使用 ddddocr 的 slide_match / slide_comparison 两种算法:
      - slide_match:     有滑块小图 + 背景大图 → 边缘匹配
      - slide_comparison: 有缺口前图 + 缺口后图 → 图像差异比较
    """

    def __init__(self, use_gpu: bool = False):
        self.slide_solver = None
        self.use_gpu = use_gpu

    def _init_solver(self):
        if self.slide_solver is not None:
            return
        try:
            import ddddocr
            self.slide_solver = ddddocr.DdddOcr(
                ocr=False,
                det=False,
                use_gpu=self.use_gpu,
                show_ad=False,
            )
            logger.info("ddddocr 滑块模型已加载")
        except ImportError:
            raise ImportError("ddddocr 未安装 (pip install ddddocr)")

    def solve(
        self,
        bg_image: bytes,
        slider_image: bytes,
        algorithm: str = "match",
    ) -> CaptchaResult:
        """
        识别滑块缺口距离。

        :param bg_image:     背景图（带缺口）
        :param slider_image: 滑块小图（或缺口前图）
        :param algorithm:    "match" = 边缘匹配 (有滑块小图)
                             "comparison" = 图像差异 (有前图+后图)
        :return: CaptchaResult，answer 为缺口 X 坐标偏移量
        """
        try:
            self._init_solver()

            if algorithm == "comparison":
                # 图像差异比较算法
                result = self.slide_solver.slide_comparison(
                    slider_image, bg_image
                )
                # result: {"target": [x, y, w, h]}
                target_x = result.get("target", [0])[0]
            else:
                # 边缘匹配算法 (默认)
                result = self.slide_solver.slide_match(
                    slider_image, bg_image
                )
                # result: {"target": [x, y, w, h], "target_y": y}
                target_x = result.get("target", [0])[0]

            logger.info(f"滑块缺口位置: x={target_x}")

            # 生成滑动轨迹
            track = self._generate_track(target_x)

            return CaptchaResult(
                success=True,
                captcha_type=CaptchaType.SLIDE,
                answer=target_x,
                details={
                    "track": track,
                    "raw_result": result,
                },
            )

        except Exception as e:
            return CaptchaResult(
                success=False,
                captcha_type=CaptchaType.SLIDE,
                error=f"滑块识别异常: {e}",
            )

    def _generate_track(self, distance: int) -> List[Dict[str, Any]]:
        """
        生成人类滑动轨迹（模拟先快后慢 + 微调）。

        :param distance: 需要滑动的距离（像素）
        :return: 轨迹列表 [{"x": 偏移, "y": 偏移, "time_ms": 间隔}, ...]
        """
        track = []
        current = 0
        # 减速加速度
        t = 0.2
        v = 0
        mid = distance * 4 / 5  # 前 4/5 加速，后 1/5 减速

        while current < distance:
            if current < mid:
                a = 2  # 加速度
            else:
                a = -3  # 减速度

            v0 = v
            v = v0 + a * t
            move = v0 * t + 0.5 * a * t * t
            current += move
            track.append({
                "x": round(move, 2),
                "y": random.randint(-1, 1),  # Y 轴微小抖动
                "time_ms": random.randint(10, 30),
            })

        # 最后微调回正
        if current > distance:
            overshoot = current - distance
            track.append({
                "x": -overshoot,
                "y": 0,
                "time_ms": random.randint(50, 100),
            })

        return track


# ===========================================================================
# 策略 5: 第三方打码平台 (reCAPTCHA / hCaptcha / Turnstile / FunCaptcha)
# ===========================================================================
class ThirdPartyCaptchaSolver:
    """
    通过第三方打码平台解决复杂验证码。

    支持平台:
      - 2captcha:   https://2captcha.com
      - capsolver:  https://capsolver.com
      - yescaptcha: https://yescaptcha.com

    支持验证码类型:
      - reCAPTCHA v2 / v3
      - hCaptcha
      - Cloudflare Turnstile
      - FunCaptcha (Arkose Labs)
    """

    # 平台 API 地址
    PLATFORM_URLS = {
        "2captcha": {
            "submit": "https://2captcha.com/in.php",
            "result": "https://2captcha.com/res.php",
        },
        "capsolver": {
            "submit": "https://api.capsolver.com/createTask",
            "result": "https://api.capsolver.com/getTaskResult",
        },
        "yescaptcha": {
            "submit": "https://api.yescaptcha.com/createTask",
            "result": "https://api.yescaptcha.com/getTaskResult",
        },
    }

    def __init__(
        self,
        platform: str = "2captcha",
        api_key: str = "",
        max_wait: int = 120,
    ):
        """
        :param platform: 打码平台 ("2captcha" / "capsolver" / "yescaptcha")
        :param api_key:  平台 API Key
        :param max_wait: 最大等待时间（秒）
        """
        self.platform = platform
        self.api_key = api_key
        self.max_wait = max_wait

    def solve_recaptcha_v2(
        self,
        site_key: str,
        page_url: str,
    ) -> CaptchaResult:
        """
        解决 reCAPTCHA v2。

        :param site_key: 网站的 data-sitekey 值
        :param page_url: 验证码所在页面 URL
        :return: CaptchaResult，answer 为 g-recaptcha-response token
        """
        if self.platform == "2captcha":
            return self._solve_2captcha_recaptcha_v2(site_key, page_url)
        elif self.platform in ("capsolver", "yescaptcha"):
            return self._solve_capsolver_recaptcha_v2(site_key, page_url)
        else:
            return CaptchaResult(
                success=False,
                captcha_type=CaptchaType.RECAPTCHA_V2,
                error=f"不支持的平台: {self.platform}",
            )

    def solve_recaptcha_v3(
        self,
        site_key: str,
        page_url: str,
        action: str = "verify",
        min_score: float = 0.7,
    ) -> CaptchaResult:
        """解决 reCAPTCHA v3"""
        if self.platform in ("capsolver", "yescaptcha"):
            return self._solve_capsolver_recaptcha_v3(
                site_key, page_url, action, min_score
            )
        elif self.platform == "2captcha":
            return self._solve_2captcha_recaptcha_v3(
                site_key, page_url, action, min_score
            )
        else:
            return CaptchaResult(
                success=False,
                captcha_type=CaptchaType.RECAPTCHA_V3,
                error=f"不支持的平台: {self.platform}",
            )

    def solve_hcaptcha(
        self,
        site_key: str,
        page_url: str,
    ) -> CaptchaResult:
        """解决 hCaptcha"""
        if self.platform in ("capsolver", "yescaptcha"):
            return self._solve_capsolver_hcaptcha(site_key, page_url)
        elif self.platform == "2captcha":
            return self._solve_2captcha_hcaptcha(site_key, page_url)
        else:
            return CaptchaResult(
                success=False,
                captcha_type=CaptchaType.HCAPTCHA,
                error=f"不支持的平台: {self.platform}",
            )

    def solve_turnstile(
        self,
        site_key: str,
        page_url: str,
    ) -> CaptchaResult:
        """
        解决 Cloudflare Turnstile 验证码。

        :param site_key: Turnstile data-sitekey
        :param page_url: 页面 URL
        :return: CaptchaResult，answer 为 cf-turnstile-response token
        """
        if self.platform in ("capsolver", "yescaptcha"):
            return self._solve_capsolver_turnstile(site_key, page_url)
        elif self.platform == "2captcha":
            return self._solve_2captcha_turnstile(site_key, page_url)
        else:
            return CaptchaResult(
                success=False,
                captcha_type=CaptchaType.TURNSTILE,
                error=f"不支持的平台: {self.platform}",
            )

    def solve_funcaptcha(
        self,
        public_key: str,
        page_url: str,
        service_url: str = "",
    ) -> CaptchaResult:
        """解决 FunCaptcha (Arkose Labs)"""
        if self.platform in ("capsolver", "yescaptcha"):
            return self._solve_capsolver_funcaptcha(
                public_key, page_url, service_url
            )
        else:
            return CaptchaResult(
                success=False,
                captcha_type=CaptchaType.FUNCAPTCHA,
                error=f"平台 {self.platform} 暂不支持 FunCaptcha",
            )

    # ---- 2captcha 实现 ----

    def _solve_2captcha_recaptcha_v2(self, site_key, page_url):
        import requests
        try:
            resp = requests.post(self.PLATFORM_URLS["2captcha"]["submit"], data={
                "key": self.api_key,
                "method": "userrecaptcha",
                "googlekey": site_key,
                "pageurl": page_url,
                "json": 1,
            }, timeout=30)
            data = resp.json()
            if data.get("status") != 1:
                return CaptchaResult(
                    success=False, captcha_type=CaptchaType.RECAPTCHA_V2,
                    error=f"2captcha 提交失败: {data.get('request')}"
                )
            task_id = data["request"]
            token = self._poll_2captcha(task_id)
            if token:
                return CaptchaResult(
                    success=True, captcha_type=CaptchaType.RECAPTCHA_V2,
                    answer=token, details={"task_id": task_id}
                )
            return CaptchaResult(
                success=False, captcha_type=CaptchaType.RECAPTCHA_V2,
                error="2captcha 等待超时"
            )
        except Exception as e:
            return CaptchaResult(
                success=False, captcha_type=CaptchaType.RECAPTCHA_V2,
                error=f"2captcha 异常: {e}"
            )

    def _solve_2captcha_recaptcha_v3(self, site_key, page_url, action, min_score):
        import requests
        try:
            resp = requests.post(self.PLATFORM_URLS["2captcha"]["submit"], data={
                "key": self.api_key,
                "method": "userrecaptcha",
                "googlekey": site_key,
                "pageurl": page_url,
                "version": "v3",
                "action": action,
                "min_score": min_score,
                "json": 1,
            }, timeout=30)
            data = resp.json()
            if data.get("status") != 1:
                return CaptchaResult(
                    success=False, captcha_type=CaptchaType.RECAPTCHA_V3,
                    error=f"2captcha 提交失败: {data.get('request')}"
                )
            task_id = data["request"]
            token = self._poll_2captcha(task_id)
            if token:
                return CaptchaResult(
                    success=True, captcha_type=CaptchaType.RECAPTCHA_V3,
                    answer=token, details={"task_id": task_id}
                )
            return CaptchaResult(
                success=False, captcha_type=CaptchaType.RECAPTCHA_V3,
                error="2captcha 等待超时"
            )
        except Exception as e:
            return CaptchaResult(
                success=False, captcha_type=CaptchaType.RECAPTCHA_V3,
                error=f"2captcha 异常: {e}"
            )

    def _solve_2captcha_hcaptcha(self, site_key, page_url):
        import requests
        try:
            resp = requests.post(self.PLATFORM_URLS["2captcha"]["submit"], data={
                "key": self.api_key,
                "method": "hcaptcha",
                "sitekey": site_key,
                "pageurl": page_url,
                "json": 1,
            }, timeout=30)
            data = resp.json()
            if data.get("status") != 1:
                return CaptchaResult(
                    success=False, captcha_type=CaptchaType.HCAPTCHA,
                    error=f"2captcha 提交失败: {data.get('request')}"
                )
            task_id = data["request"]
            token = self._poll_2captcha(task_id)
            if token:
                return CaptchaResult(
                    success=True, captcha_type=CaptchaType.HCAPTCHA,
                    answer=token, details={"task_id": task_id}
                )
            return CaptchaResult(
                success=False, captcha_type=CaptchaType.HCAPTCHA,
                error="2captcha 等待超时"
            )
        except Exception as e:
            return CaptchaResult(
                success=False, captcha_type=CaptchaType.HCAPTCHA,
                error=f"2captcha 异常: {e}"
            )

    def _solve_2captcha_turnstile(self, site_key, page_url):
        import requests
        try:
            resp = requests.post(self.PLATFORM_URLS["2captcha"]["submit"], data={
                "key": self.api_key,
                "method": "turnstile",
                "sitekey": site_key,
                "pageurl": page_url,
                "json": 1,
            }, timeout=30)
            data = resp.json()
            if data.get("status") != 1:
                return CaptchaResult(
                    success=False, captcha_type=CaptchaType.TURNSTILE,
                    error=f"2captcha 提交失败: {data.get('request')}"
                )
            task_id = data["request"]
            token = self._poll_2captcha(task_id)
            if token:
                return CaptchaResult(
                    success=True, captcha_type=CaptchaType.TURNSTILE,
                    answer=token, details={"task_id": task_id}
                )
            return CaptchaResult(
                success=False, captcha_type=CaptchaType.TURNSTILE,
                error="2captcha 等待超时"
            )
        except Exception as e:
            return CaptchaResult(
                success=False, captcha_type=CaptchaType.TURNSTILE,
                error=f"2captcha 异常: {e}"
            )

    def _poll_2captcha(self, task_id: str) -> Optional[str]:
        """轮询 2captcha 结果"""
        import requests
        start = time.time()
        time.sleep(10)  # 首次等待 10 秒
        while time.time() - start < self.max_wait:
            try:
                resp = requests.get(
                    self.PLATFORM_URLS["2captcha"]["result"],
                    params={"key": self.api_key, "action": "get", "id": task_id, "json": 1},
                    timeout=15,
                )
                data = resp.json()
                if data.get("status") == 1:
                    return data.get("request")
                elif data.get("request") == "CAPCHA_NOT_READY":
                    time.sleep(5)
                else:
                    logger.error(f"2captcha 错误: {data.get('request')}")
                    return None
            except Exception as e:
                logger.warning(f"轮询异常: {e}")
                time.sleep(5)
        return None

    # ---- capsolver / yescaptcha 实现 ----

    def _solve_capsolver_recaptcha_v2(self, site_key, page_url):
        task = {
            "type": "ReCaptchaV2TaskProxyLess",
            "websiteURL": page_url,
            "websiteKey": site_key,
        }
        return self._solve_capsolver(task, CaptchaType.RECAPTCHA_V2)

    def _solve_capsolver_recaptcha_v3(self, site_key, page_url, action, min_score):
        task = {
            "type": "ReCaptchaV3TaskProxyLess",
            "websiteURL": page_url,
            "websiteKey": site_key,
            "pageAction": action,
            "minScore": min_score,
        }
        return self._solve_capsolver(task, CaptchaType.RECAPTCHA_V3)

    def _solve_capsolver_hcaptcha(self, site_key, page_url):
        task = {
            "type": "HCaptchaTaskProxyless",
            "websiteURL": page_url,
            "websiteKey": site_key,
        }
        return self._solve_capsolver(task, CaptchaType.HCAPTCHA)

    def _solve_capsolver_turnstile(self, site_key, page_url):
        task = {
            "type": "AntiTurnstileTaskProxyLess",
            "websiteURL": page_url,
            "websiteKey": site_key,
        }
        return self._solve_capsolver(task, CaptchaType.TURNSTILE)

    def _solve_capsolver_funcaptcha(self, public_key, page_url, service_url):
        task = {
            "type": "FunCaptchaTaskProxyless",
            "websiteURL": page_url,
            "websitePublicKey": public_key,
        }
        if service_url:
            task["funcaptchaApiJSSubdomain"] = service_url
        return self._solve_capsolver(task, CaptchaType.FUNCAPTCHA)

    def _solve_capsolver(self, task: dict, captcha_type: CaptchaType) -> CaptchaResult:
        """capsolver / yescaptcha 通用提交+轮询"""
        import requests
        try:
            # 创建任务
            resp = requests.post(
                self.PLATFORM_URLS[self.platform]["submit"],
                json={
                    "clientKey": self.api_key,
                    "task": task,
                },
                timeout=30,
            )
            data = resp.json()
            if data.get("errorId") != 0:
                return CaptchaResult(
                    success=False, captcha_type=captcha_type,
                    error=f"{self.platform} 提交失败: {data.get('errorDescription')}"
                )
            task_id = data.get("taskId")

            # 轮询结果
            start = time.time()
            time.sleep(5)
            while time.time() - start < self.max_wait:
                resp = requests.post(
                    self.PLATFORM_URLS[self.platform]["result"],
                    json={"clientKey": self.api_key, "taskId": task_id},
                    timeout=15,
                )
                data = resp.json()
                if data.get("status") == "ready":
                    solution = data.get("solution", {})
                    # 不同验证码返回字段不同
                    token = (solution.get("gRecaptchaResponse")
                             or solution.get("token")
                             or solution.get("cfTurnstileResponse")
                             or "")
                    if token:
                        return CaptchaResult(
                            success=True, captcha_type=captcha_type,
                            answer=token, details={"task_id": task_id, "solution": solution}
                        )
                elif data.get("status") == "processing":
                    time.sleep(3)
                else:
                    return CaptchaResult(
                        success=False, captcha_type=captcha_type,
                        error=f"{self.platform} 错误: {data.get('errorDescription')}"
                    )

            return CaptchaResult(
                success=False, captcha_type=captcha_type,
                error=f"{self.platform} 等待超时"
            )
        except Exception as e:
            return CaptchaResult(
                success=False, captcha_type=captcha_type,
                error=f"{self.platform} 异常: {e}"
            )


# ===========================================================================
# 主控制器: 自动检测 + 路由
# ===========================================================================
class CaptchaSolver:
    """
    验证码自动识别主控制器。

    自动检测验证码类型，路由到对应的解决策略。
    支持从图片、页面 HTML 或元素特征中检测类型。

    用法:
        solver = CaptchaSolver()

        # 文字验证码
        result = solver.solve_image(image_bytes)

        # 从页面 HTML 检测并解决
        result = solver.solve_from_html(html, page_url="https://example.com")

        # 指定类型
        result = solver.solve_image(image_bytes, captcha_type=CaptchaType.MATH)
    """

    def __init__(
        self,
        use_gpu: bool = False,
        third_party_platform: str = "2captcha",
        third_party_api_key: str = "",
        max_wait: int = 120,
    ):
        """
        :param use_gpu:               ddddocr 是否使用 GPU
        :param third_party_platform:  第三方打码平台
        :param third_party_api_key:   打码平台 API Key
        :param max_wait:              打码平台最大等待时间
        """
        self.use_gpu = use_gpu
        self.detector = CaptchaDetector()

        # 延迟初始化的子 solver
        self._text_solver = None
        self._math_solver = None
        self._click_solver = None
        self._slide_solver = None
        self._third_party_solver = None
        self._hcaptcha_grid_solver = None
        self._geetest_solver = None
        self._geetest_v4_solver = None
        self._funcaptcha_solver = None
        self._recaptcha_image_solver = None
        self._slide_comparison_solver = None
        self._hcaptcha_browser_solver = None

        self._third_party_platform = third_party_platform
        self._third_party_api_key = third_party_api_key
        self._max_wait = max_wait

    # ---- 延迟初始化 ----

    @property
    def text_solver(self):
        if self._text_solver is None:
            self._text_solver = TextCaptchaSolver(use_gpu=self.use_gpu)
        return self._text_solver

    @property
    def math_solver(self):
        if self._math_solver is None:
            self._math_solver = MathCaptchaSolver(use_gpu=self.use_gpu)
        return self._math_solver

    @property
    def click_solver(self):
        if self._click_solver is None:
            self._click_solver = ClickCaptchaSolver(use_gpu=self.use_gpu)
        return self._click_solver

    @property
    def slide_solver(self):
        if self._slide_solver is None:
            self._slide_solver = SlideCaptchaSolver(use_gpu=self.use_gpu)
        return self._slide_solver

    @property
    def third_party(self):
        if self._third_party_solver is None:
            self._third_party_solver = ThirdPartyCaptchaSolver(
                platform=self._third_party_platform,
                api_key=self._third_party_api_key,
                max_wait=self._max_wait,
            )
        return self._third_party_solver

    @property
    def hcaptcha_grid(self):
        """hCaptcha 九宫格本地 ONNX 求解器"""
        if self._hcaptcha_grid_solver is None:
            from .advanced_solvers import HCaptchaGridSolver
            self._hcaptcha_grid_solver = HCaptchaGridSolver(use_gpu=self.use_gpu)
        return self._hcaptcha_grid_solver

    @property
    def hcaptcha_grid_api(self):
        """hCaptcha 九宫格 API 求解器"""
        from .advanced_solvers import HCaptchaGridAPISolver
        return HCaptchaGridAPISolver(
            platform=self._third_party_platform,
            api_key=self._third_party_api_key,
        )

    @property
    def geetest(self):
        """GeeTest 极验验证码求解器"""
        if self._geetest_solver is None:
            from .advanced_solvers import GeeTestSolver
            self._geetest_solver = GeeTestSolver(use_gpu=self.use_gpu)
        return self._geetest_solver

    @property
    def geetest_v4(self):
        """GeeTest V4 极验第四代验证码求解器"""
        if self._geetest_v4_solver is None:
            from .advanced_solvers import GeeTestV4Solver
            self._geetest_v4_solver = GeeTestV4Solver(use_gpu=self.use_gpu)
        return self._geetest_v4_solver

    @property
    def funcaptcha(self):
        """FunCaptcha (Arkose Labs) 求解器"""
        if self._funcaptcha_solver is None:
            from .advanced_solvers import FunCaptchaSolver
            self._funcaptcha_solver = FunCaptchaSolver(use_gpu=self.use_gpu)
        return self._funcaptcha_solver

    @property
    def recaptcha_image(self):
        """reCAPTCHA 图片分类求解器"""
        if self._recaptcha_image_solver is None:
            from .advanced_solvers import ReCaptchaImageSolver
            self._recaptcha_image_solver = ReCaptchaImageSolver(use_gpu=self.use_gpu)
        return self._recaptcha_image_solver

    @property
    def slide_comparison(self):
        """图片差异滑块求解器 (前图+后图模式)"""
        if self._slide_comparison_solver is None:
            from .advanced_solvers import SlideComparisonSolver
            self._slide_comparison_solver = SlideComparisonSolver(use_gpu=self.use_gpu)
        return self._slide_comparison_solver

    @property
    def hcaptcha_browser(self):
        """hCaptcha 浏览器自动化求解器"""
        if self._hcaptcha_browser_solver is None:
            from .advanced_solvers import HCaptchaBrowserSolver
            self._hcaptcha_browser_solver = HCaptchaBrowserSolver(use_gpu=self.use_gpu)
        return self._hcaptcha_browser_solver

    # ---- 公共接口 ----

    def solve_image(
        self,
        image_bytes: bytes,
        captcha_type: Optional[CaptchaType] = None,
        **kwargs,
    ) -> CaptchaResult:
        """
        从图片识别验证码。

        :param image_bytes:   验证码图片二进制
        :param captcha_type:  指定类型（不指定则自动检测）
        :param kwargs:        额外参数（target_text, bg_image, slider_image 等）
        :return: CaptchaResult
        """
        # 自动检测类型
        if captcha_type is None:
            captcha_type = self.detector.detect_from_image(image_bytes)
            if captcha_type == CaptchaType.UNKNOWN:
                # 默认尝试文字识别
                captcha_type = CaptchaType.TEXT
            logger.info(f"自动检测验证码类型: {captcha_type.value}")

        return self._dispatch_image(image_bytes, captcha_type, **kwargs)

    def solve_from_html(
        self,
        html: str,
        page_url: str = "",
        captcha_type: Optional[CaptchaType] = None,
        **kwargs,
    ) -> CaptchaResult:
        """
        从页面 HTML 检测验证码类型并解决。

        对于 reCAPTCHA/hCaptcha/Turnstile 等第三方验证码，
        需要从 HTML 中提取 site_key。

        :param html:          页面 HTML
        :param page_url:      页面 URL
        :param captcha_type:  指定类型
        :return: CaptchaResult
        """
        if captcha_type is None:
            captcha_type = self.detector.detect_from_html(html)
            logger.info(f"HTML 检测验证码类型: {captcha_type.value}")

        if captcha_type == CaptchaType.UNKNOWN:
            return CaptchaResult(
                success=False,
                captcha_type=CaptchaType.UNKNOWN,
                error="未检测到验证码",
            )

        # 第三方验证码需要提取 site_key
        if captcha_type in (
            CaptchaType.RECAPTCHA_V2,
            CaptchaType.RECAPTCHA_V3,
            CaptchaType.HCAPTCHA,
            CaptchaType.TURNSTILE,
            CaptchaType.FUNCAPTCHA,
            CaptchaType.GEETEST,
            CaptchaType.GEETEST_V4,
            CaptchaType.AWS_WAF,
        ):
            site_key = self._extract_sitekey(html, captcha_type)
            if not site_key:
                return CaptchaResult(
                    success=False,
                    captcha_type=captcha_type,
                    error="未能从 HTML 中提取 site_key",
                )
            return self._dispatch_third_party(captcha_type, site_key, page_url, **kwargs)

        # 本地验证码类型需要图片
        return CaptchaResult(
            success=False,
            captcha_type=captcha_type,
            error="该验证码类型需要提供图片，请使用 solve_image()",
        )

    # ---- 路由 ----

    def _dispatch_image(
        self,
        image_bytes: bytes,
        captcha_type: CaptchaType,
        **kwargs,
    ) -> CaptchaResult:
        """路由图片验证码到对应 solver"""
        if captcha_type == CaptchaType.TEXT:
            charset = kwargs.get("charset", "")
            return self.text_solver.solve(image_bytes, charset=charset)

        elif captcha_type == CaptchaType.MATH:
            return self.math_solver.solve(image_bytes)

        elif captcha_type == CaptchaType.CLICK_OBJECT:
            target_img = kwargs.get("target_image_bytes")
            return self.click_solver.solve_object_click(image_bytes, target_img)

        elif captcha_type == CaptchaType.CLICK_ORDER:
            target_text = kwargs.get("target_text", "")
            return self.click_solver.solve_order_click(image_bytes, target_text)

        elif captcha_type == CaptchaType.SLIDE:
            bg = kwargs.get("bg_image", image_bytes)
            slider = kwargs.get("slider_image")
            if not slider:
                return CaptchaResult(
                    success=False,
                    captcha_type=CaptchaType.SLIDE,
                    error="滑块验证码需要提供 slider_image 参数",
                )
            algorithm = kwargs.get("algorithm", "match")
            return self.slide_solver.solve(bg, slider, algorithm)

        else:
            return CaptchaResult(
                success=False,
                captcha_type=captcha_type,
                error=f"图片模式不支持该类型: {captcha_type.value}",
            )

    def _dispatch_third_party(
        self,
        captcha_type: CaptchaType,
        site_key: str,
        page_url: str,
        **kwargs,
    ) -> CaptchaResult:
        """路由第三方验证码"""
        if captcha_type == CaptchaType.RECAPTCHA_V2:
            return self.third_party.solve_recaptcha_v2(site_key, page_url)
        elif captcha_type == CaptchaType.RECAPTCHA_V3:
            action = kwargs.get("action", "verify")
            min_score = kwargs.get("min_score", 0.7)
            return self.third_party.solve_recaptcha_v3(
                site_key, page_url, action, min_score
            )
        elif captcha_type == CaptchaType.HCAPTCHA:
            return self.third_party.solve_hcaptcha(site_key, page_url)
        elif captcha_type == CaptchaType.TURNSTILE:
            return self.third_party.solve_turnstile(site_key, page_url)
        elif captcha_type == CaptchaType.FUNCAPTCHA:
            service_url = kwargs.get("service_url", "")
            return self.third_party.solve_funcaptcha(
                site_key, page_url, service_url
            )
        elif captcha_type == CaptchaType.GEETEST:
            # GeeTest 需要 gt + challenge 参数
            gt = site_key  # site_key 即为 gt
            challenge = kwargs.get("challenge", "")
            return self.geetest.solve_via_api(
                gt=gt, challenge=challenge, page_url=page_url,
                api_key=self._third_party_api_key,
                platform=self._third_party_platform,
            )
        elif captcha_type == CaptchaType.GEETEST_V4:
            # GeeTest V4 使用 captcha_id + lot_number
            captcha_id = site_key
            lot_number = kwargs.get("lot_number", "")
            return self.geetest_v4.solve_via_api(
                captcha_id=captcha_id, page_url=page_url,
                lot_number=lot_number,
                api_key=self._third_party_api_key,
                platform=self._third_party_platform,
            )
        elif captcha_type == CaptchaType.AWS_WAF:
            from .advanced_solvers import AWSWAFCaptchaSolver
            solver = AWSWAFCaptchaSolver()
            return solver.solve_via_api(
                site_key=site_key, page_url=page_url,
                iv=kwargs.get("iv", ""), context=kwargs.get("context", ""),
                api_key=self._third_party_api_key,
                platform=self._third_party_platform,
            )
        elif captcha_type == CaptchaType.FUNCAPTCHA:
            # 使用增强版 FunCaptcha 求解器
            service_url = kwargs.get("service_url", "")
            return self.funcaptcha.solve_via_api(
                public_key=site_key, page_url=page_url,
                service_url=service_url,
                api_key=self._third_party_api_key,
                platform=self._third_party_platform,
            )
        else:
            return CaptchaResult(
                success=False,
                captcha_type=captcha_type,
                error=f"第三方模式不支持该类型: {captcha_type.value}",
            )

    # ---- 辅助 ----

    def _extract_sitekey(self, html: str, captcha_type: CaptchaType) -> Optional[str]:
        """从 HTML 中提取 site_key / public_key / captcha_id"""
        patterns = {
            CaptchaType.RECAPTCHA_V2: r'data-sitekey="([^"]+)"',
            CaptchaType.RECAPTCHA_V3: r'data-sitekey="([^"]+)"',
            CaptchaType.HCAPTCHA: r'data-sitekey="([^"]+)"',
            CaptchaType.TURNSTILE: r'data-sitekey="([^"]+)"',
            CaptchaType.FUNCAPTCHA: r'data-pkey="([^"]+)"|pkey=([A-Fa-f0-9-]{36})',
            CaptchaType.GEETEST: r'gt["\s:=]+([a-z0-9]{32})|data-gt="([^"]+)"',
            CaptchaType.GEETEST_V4: r'captcha[_-]?id["\s:=]+([a-z0-9]+)|data-captcha-id="([^"]+)"',
            CaptchaType.AWS_WAF: r'data-sitekey="([^"]+)"|sitekey["\s:=]+([A-Za-z0-9_-]+)',
        }
        pattern = patterns.get(captcha_type)
        if not pattern:
            return None

        match = re.search(pattern, html)
        if match:
            # 返回第一个非 None 的捕获组
            for g in match.groups():
                if g:
                    return g

        # 备选：从 script src 中提取
        if captcha_type == CaptchaType.FUNCAPTCHA:
            match = re.search(r'pkey=([A-Fa-f0-9-]{36})', html)
            if match:
                return match.group(1)

        # GeeTest 备选：从 JS 变量中提取
        if captcha_type == CaptchaType.GEETEST:
            match = re.search(r'gt\s*[:=]\s*["\']([a-z0-9]{32})["\']', html)
            if match:
                return match.group(1)

        return None


# ===========================================================================
# 便捷函数
# ===========================================================================
def solve_text_captcha(image_path: str, charset: str = "") -> str:
    """
    快捷函数: 识别文字验证码图片。

    :param image_path: 图片路径
    :param charset:    字符集限制
    :return: 识别结果
    """
    with open(image_path, "rb") as f:
        image_bytes = f.read()

    solver = CaptchaSolver()
    result = solver.solve_image(image_bytes, captcha_type=CaptchaType.TEXT, charset=charset)
    return result.answer if result.success else ""


def solve_math_captcha(image_path: str) -> Optional[Union[int, str]]:
    """
    快捷函数: 识别算术验证码。

    :param image_path: 图片路径
    :return: 计算结果
    """
    with open(image_path, "rb") as f:
        image_bytes = f.read()

    solver = CaptchaSolver()
    result = solver.solve_image(image_bytes, captcha_type=CaptchaType.MATH)
    return result.answer if result.success else None


def solve_slide_captcha(bg_path: str, slider_path: str) -> Optional[int]:
    """
    快捷函数: 识别滑块验证码缺口距离。

    :param bg_path:     背景图路径
    :param slider_path: 滑块图路径
    :return: 缺口 X 坐标
    """
    with open(bg_path, "rb") as f:
        bg = f.read()
    with open(slider_path, "rb") as f:
        slider = f.read()

    solver = CaptchaSolver()
    result = solver.solve_image(bg, captcha_type=CaptchaType.SLIDE,
                                slider_image=slider, bg_image=bg)
    return result.answer if result.success else None


def solve_click_captcha(image_path: str, target_text: str = "") -> List[Tuple[int, int]]:
    """
    快捷函数: 识别点选验证码。

    :param image_path:  图片路径
    :param target_text: 顺序点选的目标文字
    :return: 点击坐标列表
    """
    with open(image_path, "rb") as f:
        image_bytes = f.read()

    solver = CaptchaSolver()
    if target_text:
        result = solver.solve_image(
            image_bytes, captcha_type=CaptchaType.CLICK_ORDER, target_text=target_text
        )
    else:
        result = solver.solve_image(image_bytes, captcha_type=CaptchaType.CLICK_OBJECT)
    return result.answer if result.success else []


def solve_turnstile(site_key: str, page_url: str,
                    platform: str = "2captcha", api_key: str = "") -> str:
    """
    快捷函数: 解决 Cloudflare Turnstile 验证码。

    :param site_key: Turnstile sitekey
    :param page_url: 页面 URL
    :param platform: 打码平台
    :param api_key:  API Key
    :return: cf-turnstile-response token
    """
    solver = CaptchaSolver(
        third_party_platform=platform,
        third_party_api_key=api_key,
    )
    result = solver.third_party.solve_turnstile(site_key, page_url)
    return result.answer if result.success else ""


# ===========================================================================
# 命令行入口
# ===========================================================================
def main():
    import argparse
    import sys

    parser = argparse.ArgumentParser(
        description="验证码自动识别工具",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  # 识别文字验证码
  python captcha_solver.py text --image captcha.png

  # 识别算术验证码
  python captcha_solver.py math --image math_captcha.png

  # 识别滑块验证码
  python captcha_solver.py slide --bg bg.png --slider slider.png

  # 识别点选验证码
  python captcha_solver.py click --image click.png --text "星空大海"

  # 检测 HTML 中的验证码类型
  python captcha_solver.py detect --html page.html

  # 解决 Turnstile (需要打码平台)
  python captcha_solver.py turnstile --site-key 0x4AAA --url https://example.com \\
    --platform 2captcha --api-key YOUR_KEY

合规提醒：仅供技术研究学习，请遵守目标网站服务条款和相关法律法规。
        """,
    )

    subparsers = parser.add_subparsers(dest="command", help="验证码类型")

    # text
    p_text = subparsers.add_parser("text", help="文字验证码")
    p_text.add_argument("--image", required=True, help="图片路径")
    p_text.add_argument("--charset", default="", help="字符集限制")

    # math
    p_math = subparsers.add_parser("math", help="算术验证码")
    p_math.add_argument("--image", required=True, help="图片路径")

    # slide
    p_slide = subparsers.add_parser("slide", help="滑块验证码")
    p_slide.add_argument("--bg", required=True, help="背景图路径")
    p_slide.add_argument("--slider", required=True, help="滑块图路径")

    # click
    p_click = subparsers.add_parser("click", help="点选验证码")
    p_click.add_argument("--image", required=True, help="图片路径")
    p_click.add_argument("--text", default="", help="顺序点选目标文字")

    # detect
    p_detect = subparsers.add_parser("detect", help="检测验证码类型")
    p_detect.add_argument("--html", required=True, help="HTML 文件路径")

    # turnstile
    p_ts = subparsers.add_parser("turnstile", help="Cloudflare Turnstile")
    p_ts.add_argument("--site-key", required=True, help="Turnstile sitekey")
    p_ts.add_argument("--url", required=True, help="页面 URL")
    p_ts.add_argument("--platform", default="2captcha", help="打码平台")
    p_ts.add_argument("--api-key", default="", help="API Key")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return 1

    if args.command == "text":
        result = solve_text_captcha(args.image, args.charset)
        print(f"识别结果: {result}")

    elif args.command == "math":
        result = solve_math_captcha(args.image)
        print(f"计算结果: {result}")

    elif args.command == "slide":
        result = solve_slide_captcha(args.bg, args.slider)
        print(f"缺口距离: {result}")

    elif args.command == "click":
        result = solve_click_captcha(args.image, args.text)
        print(f"点击坐标: {result}")

    elif args.command == "detect":
        with open(args.html, "r", encoding="utf-8") as f:
            html = f.read()
        solver = CaptchaSolver()
        ct = solver.detector.detect_from_html(html)
        print(f"检测到验证码类型: {ct.value}")

    elif args.command == "turnstile":
        result = solve_turnstile(args.site_key, args.url, args.platform, args.api_key)
        if result:
            print(f"Turnstile token: {result[:50]}...")
        else:
            print("解决失败")

    return 0


if __name__ == "__main__":
    import sys
    sys.exit(main())
