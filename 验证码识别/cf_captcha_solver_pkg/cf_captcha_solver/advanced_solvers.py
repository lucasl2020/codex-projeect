#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
高级验证码求解器
================
基于参考链接和 GitHub 开源方案的增强验证码识别实现。

新增功能:
  1. HCaptchaGridSolver     —— hCaptcha 九宫格本地 ONNX 识别 (hcaptcha-challenger)
  2. HCaptchaGridAPISolver  —— hCaptcha 九宫格图片分类 API (YesCaptcha/2captcha)
  3. GeeTestSolver          —— 极验验证码 (滑块/点选/文字)
  4. AWSWAFCaptchaSolver    —— AWS WAF 验证码
  5. ImageClassifier        —— 通用图像分类 (CLIP/ONNX)

技术参考:
  - hcaptcha-challenger: https://github.com/QIN2DIM/hcaptcha-challenger
  - YesCaptcha hCaptcha: https://yescaptcha.atlassian.net/wiki/spaces/YESCAPTCHA/pages/24543233
  - 2captcha hCaptcha: https://2captcha.com/p/hcaptcha
  - GeeTest: https://2captcha.com/p/geetest
  - AWS WAF: https://2captcha.com/p/aws-waf

合规提醒：本模块仅供技术研究和学习使用。
"""

import re
import time
import json
import base64
import logging
import random
from typing import Optional, List, Dict, Any, Tuple, Union
from io import BytesIO
from dataclasses import dataclass, field
from enum import Enum

from .captcha import CaptchaType, CaptchaResult, logger


# ===========================================================================
# hCaptcha 九宫格本地 ONNX 求解器
# ===========================================================================
class HCaptchaGridSolver:
    """
    hCaptcha 九宫格本地识别器。

    使用 hcaptcha-challenger 库的 ONNX MoE 模型进行本地图片分类，
    无需第三方 API，免费且快速。

    依赖:
        pip install hcaptcha-challenger

    工作流程:
        1. 接收 hCaptcha 验证码的问题文字 + 九宫格图片列表
        2. 用 ONNX 模型对每张图片进行分类
        3. 返回每张图片是否匹配问题的布尔列表

    参考: https://github.com/QIN2DIM/hcaptcha-challenger
    """

    def __init__(self, use_gpu: bool = False):
        """
        :param use_gpu: 是否使用 GPU 推理
        """
        self.use_gpu = use_gpu
        self._solver = None

    def _init_solver(self):
        """延迟初始化 hcaptcha-challenger"""
        if self._solver is not None:
            return
        try:
            import hcaptcha_challenger as solver
            # 初始化本地模型库
            solver.install()
            self._solver = solver
            logger.info("hcaptcha-challenger ONNX 模型已加载")
        except ImportError:
            raise ImportError(
                "hcaptcha-challenger 未安装 (pip install hcaptcha-challenger)"
            )

    def classify_images(
        self,
        prompt: str,
        images: List[bytes],
    ) -> CaptchaResult:
        """
        对 hCaptcha 九宫格图片进行分类。

        :param prompt:  验证码问题文字，如 "请点击每张包含火车的图片"
        :param images:  九宫格图片二进制列表（通常 9 张）
        :return: CaptchaResult，answer 为 List[bool]，表示每张图是否匹配
        """
        try:
            self._init_solver()
            solver = self._solver

            # 使用 hcaptcha-challenger 的分类接口
            # 将图片写入临时文件或直接传入 bytes
            results = []
            for img_bytes in images:
                # hcaptcha-challenger 支持 bytes 输入
                result = solver.classify(prompt, img_bytes)
                results.append(bool(result))

            return CaptchaResult(
                success=True,
                captcha_type=CaptchaType.HCAPTCHA,
                answer=results,
                details={
                    "prompt": prompt,
                    "image_count": len(images),
                    "matched": sum(results),
                },
            )

        except Exception as e:
            return CaptchaResult(
                success=False,
                captcha_type=CaptchaType.HCAPTCHA,
                error=f"hCaptcha 本地分类异常: {e}",
            )

    def solve_grid(
        self,
        prompt: str,
        images: List[bytes],
    ) -> CaptchaResult:
        """classify_images 的别名"""
        return self.classify_images(prompt, images)


# ===========================================================================
# hCaptcha 九宫格 API 求解器 (图片分类模式)
# ===========================================================================
class HCaptchaGridAPISolver:
    """
    通过第三方 API 对 hCaptcha 九宫格图片进行分类。

    与 token 模式不同，这种方式直接发送图片给 API 进行分类，
    适用于已经在浏览器中获取到验证码图片的场景。

    支持平台:
      - yescaptcha: HCaptchaClassification 接口
      - 2captcha:   hcaptcha 方法 + 图片
      - capsolver:  HCaptchaClassification 接口

    参考:
      - https://yescaptcha.atlassian.net/wiki/spaces/YESCAPTCHA/pages/24543233
      - https://www.cnblogs.com/cuihongyu3503319/p/17620692.html
    """

    # 平台 API 地址
    PLATFORM_URLS = {
        "yescaptcha": "https://api.yescaptcha.com/createTask",
        "capsolver": "https://api.capsolver.com/createTask",
        "2captcha": "https://2captcha.com/in.php",
    }

    def __init__(self, platform: str = "yescaptcha", api_key: str = ""):
        """
        :param platform: 打码平台
        :param api_key:  API Key
        """
        self.platform = platform
        self.api_key = api_key

    def classify_grid(
        self,
        prompt: str,
        images: List[bytes],
    ) -> CaptchaResult:
        """
        对 hCaptcha 九宫格图片进行分类。

        :param prompt:  验证码问题文字
        :param images:  九宫格图片二进制列表
        :return: CaptchaResult，answer 为 List[bool]
        """
        if not self.api_key:
            return CaptchaResult(
                success=False,
                captcha_type=CaptchaType.HCAPTCHA,
                error="未配置 API Key",
            )

        # 将图片转为 base64
        queries = [base64.b64encode(img).decode("utf-8") for img in images]

        if self.platform in ("yescaptcha", "capsolver"):
            return self._classify_capsolver(prompt, queries)
        elif self.platform == "2captcha":
            return self._classify_2captcha(prompt, queries)
        else:
            return CaptchaResult(
                success=False,
                captcha_type=CaptchaType.HCAPTCHA,
                error=f"不支持的平台: {self.platform}",
            )

    def _classify_capsolver(self, prompt: str, queries: List[str]) -> CaptchaResult:
        """capsolver / yescaptcha 图片分类"""
        import requests
        try:
            task_type = "HCaptchaClassification"
            resp = requests.post(
                self.PLATFORM_URLS[self.platform],
                json={
                    "clientKey": self.api_key,
                    "task": {
                        "type": task_type,
                        "queries": queries,
                        "question": prompt,
                    },
                },
                timeout=60,
            )
            data = resp.json()

            if data.get("errorId") != 0:
                return CaptchaResult(
                    success=False,
                    captcha_type=CaptchaType.HCAPTCHA,
                    error=f"{self.platform} 分类失败: {data.get('errorDescription')}",
                )

            # capsolver/yescaptcha 可能直接返回或需要轮询
            if data.get("status") == "ready":
                solution = data.get("solution", {})
                objects = solution.get("objects", [])
                return CaptchaResult(
                    success=True,
                    captcha_type=CaptchaType.HCAPTCHA,
                    answer=[bool(o) for o in objects],
                    details={
                        "labels": solution.get("labels", []),
                        "task_id": data.get("taskId"),
                    },
                )

            # 需要轮询
            task_id = data.get("taskId")
            if task_id:
                return self._poll_result(task_id)

            return CaptchaResult(
                success=False,
                captcha_type=CaptchaType.HCAPTCHA,
                error="API 返回异常",
            )

        except Exception as e:
            return CaptchaResult(
                success=False,
                captcha_type=CaptchaType.HCAPTCHA,
                error=f"API 分类异常: {e}",
            )

    def _classify_2captcha(self, prompt: str, queries: List[str]) -> CaptchaResult:
        """2captcha 图片分类"""
        import requests
        try:
            # 2captcha 的 hcaptcha 图片分类需要逐张提交
            results = []
            for img_b64 in queries:
                resp = requests.post(
                    self.PLATFORM_URLS["2captcha"],
                    data={
                        "key": self.api_key,
                        "method": "base64",
                        "body": img_b64,
                        "json": 1,
                    },
                    timeout=30,
                )
                data = resp.json()
                if data.get("status") == 1:
                    task_id = data["request"]
                    # 轮询结果
                    time.sleep(5)
                    result = self._poll_2captcha(task_id)
                    # 2captcha 返回文字描述，简单判断
                    results.append(result is not None)
                else:
                    results.append(False)

            return CaptchaResult(
                success=True,
                captcha_type=CaptchaType.HCAPTCHA,
                answer=results,
                details={"platform": "2captcha"},
            )

        except Exception as e:
            return CaptchaResult(
                success=False,
                captcha_type=CaptchaType.HCAPTCHA,
                error=f"2captcha 分类异常: {e}",
            )

    def _poll_2captcha(self, task_id: str) -> Optional[str]:
        """轮询 2captcha 结果"""
        import requests
        start = time.time()
        while time.time() - start < 60:
            try:
                resp = requests.get(
                    "https://2captcha.com/res.php",
                    params={
                        "key": self.api_key,
                        "action": "get",
                        "id": task_id,
                        "json": 1,
                    },
                    timeout=15,
                )
                data = resp.json()
                if data.get("status") == 1:
                    return data.get("request")
                elif data.get("request") == "CAPCHA_NOT_READY":
                    time.sleep(3)
                else:
                    return None
            except Exception:
                time.sleep(3)
        return None

    def _poll_result(self, task_id: str) -> CaptchaResult:
        """轮询 capsolver/yescaptcha 结果"""
        import requests
        result_url = self.PLATFORM_URLS[self.platform].replace("createTask", "getTaskResult")
        start = time.time()
        time.sleep(3)

        while time.time() - start < 120:
            try:
                resp = requests.post(
                    result_url,
                    json={"clientKey": self.api_key, "taskId": task_id},
                    timeout=15,
                )
                data = resp.json()
                if data.get("status") == "ready":
                    solution = data.get("solution", {})
                    objects = solution.get("objects", [])
                    return CaptchaResult(
                        success=True,
                        captcha_type=CaptchaType.HCAPTCHA,
                        answer=[bool(o) for o in objects],
                        details={
                            "labels": solution.get("labels", []),
                            "task_id": task_id,
                        },
                    )
                elif data.get("status") == "processing":
                    time.sleep(3)
                else:
                    return CaptchaResult(
                        success=False,
                        captcha_type=CaptchaType.HCAPTCHA,
                        error=f"轮询失败: {data.get('errorDescription')}",
                    )
            except Exception as e:
                logger.warning(f"轮询异常: {e}")
                time.sleep(3)

        return CaptchaResult(
            success=False,
            captcha_type=CaptchaType.HCAPTCHA,
            error="轮询超时",
        )


# ===========================================================================
# GeeTest 验证码求解器
# ===========================================================================
class GeeTestSolver:
    """
    极验验证码求解器。

    支持 GeeTest 的三种模式:
      1. 滑块验证 (slide)       —— ddddocr 缺口检测 + 轨迹
      2. 文字点选 (click)       —— ddddocr 目标检测 + OCR
      3. 图标点选 (icon click)  —— ddddocr 目标检测
      4. 语序点选 (order click) —— ddddocr OCR + 语义排序

    也支持通过第三方 API 解决:
      - 2captcha:   GeeTestTaskProxyLess
      - capsolver:  GeetestTaskProxyLess
      - yescaptcha: GeetestTaskProxyLess

    参考:
      - https://2captcha.com/p/geetest
      - https://capsolver.com/blog/Geetest/how-to-solve-geetest
    """

    def __init__(self, use_gpu: bool = False):
        self.use_gpu = use_gpu
        self._dddd_det = None
        self._dddd_ocr = None

    def _init_dddd_det(self):
        """初始化 ddddocr 目标检测"""
        if self._dddd_det is not None:
            return
        try:
            import ddddocr
            self._dddd_det = ddddocr.DdddOcr(
                det=True, ocr=False, show_ad=False, use_gpu=self.use_gpu
            )
            logger.info("ddddocr 目标检测模型已加载 (GeeTest)")
        except ImportError:
            raise ImportError("ddddocr 未安装 (pip install ddddocr)")

    def _init_dddd_ocr(self):
        """初始化 ddddocr OCR"""
        if self._dddd_ocr is not None:
            return
        try:
            import ddddocr
            self._dddd_ocr = ddddocr.DdddOcr(
                ocr=True, det=False, show_ad=False, use_gpu=self.use_gpu
            )
            logger.info("ddddocr OCR 模型已加载 (GeeTest)")
        except ImportError:
            raise ImportError("ddddocr 未安装 (pip install ddddocr)")

    def solve_slide(
        self,
        bg_image: bytes,
        slider_image: bytes,
    ) -> CaptchaResult:
        """
        解决 GeeTest 滑块验证码。

        GeeTest 滑块与普通滑块类似，但图片通常更大，
        且缺口形状为拼图块。

        :param bg_image:     背景图
        :param slider_image: 滑块图
        :return: CaptchaResult，answer 为缺口距离 (int)
        """
        try:
            from .captcha import SlideCaptchaSolver
            solver = SlideCaptchaSolver(use_gpu=self.use_gpu)
            # GeeTest 滑块使用相同的缺口检测算法
            result = solver.solve(bg_image, slider_image, algorithm="match")
            if result.success:
                result.captcha_type = CaptchaType.SLIDE
                result.details["provider"] = "geetest"
            return result

        except Exception as e:
            return CaptchaResult(
                success=False,
                captcha_type=CaptchaType.SLIDE,
                error=f"GeeTest 滑块识别异常: {e}",
            )

    def solve_click(
        self,
        bg_image: bytes,
        target_image: Optional[bytes] = None,
        target_text: str = "",
    ) -> CaptchaResult:
        """
        解决 GeeTest 点选验证码。

        GeeTest 点选有两种模式:
          1. 图标点选: 给出目标图标，在图中点击对应位置
          2. 文字点选: 给出文字提示（如"依次点击：星空 大海 草原"），
                       在图中按顺序点击对应文字

        :param bg_image:     背景图
        :param target_image: 目标图标（图标点选模式）
        :param target_text:  目标文字（文字点选模式）
        :return: CaptchaResult，answer 为 List[Tuple[int, int]]
        """
        try:
            self._init_dddd_det()

            # 检测图中所有目标的位置
            bboxes = self._dddd_det.detection(bg_image)
            if not bboxes:
                return CaptchaResult(
                    success=False,
                    captcha_type=CaptchaType.CLICK_OBJECT,
                    error="未检测到任何目标",
                )

            # 将 bbox 转为中心坐标
            click_points = []
            for bbox in bboxes:
                x1, y1, x2, y2 = bbox
                cx = (x1 + x2) // 2
                cy = (y1 + y2) // 2
                click_points.append((cx, cy))

            # 文字点选模式: 需要根据文字顺序排序
            if target_text:
                return self._solve_order_click(bg_image, click_points, target_text)

            # 图标点选模式: 直接返回所有检测到的坐标
            return CaptchaResult(
                success=True,
                captcha_type=CaptchaType.CLICK_OBJECT,
                answer=click_points,
                details={
                    "bboxes": bboxes,
                    "count": len(click_points),
                    "provider": "geetest",
                },
            )

        except Exception as e:
            return CaptchaResult(
                success=False,
                captcha_type=CaptchaType.CLICK_OBJECT,
                error=f"GeeTest 点选识别异常: {e}",
            )

    def _solve_order_click(
        self,
        bg_image: bytes,
        click_points: List[Tuple[int, int]],
        target_text: str,
    ) -> CaptchaResult:
        """
        GeeTest 语序点选: 按文字顺序点击。

        :param bg_image:    背景图
        :param click_points: 检测到的坐标
        :param target_text:  目标文字，如 "星空 大海 草原"
        :return: CaptchaResult
        """
        try:
            self._init_dddd_ocr()

            # 解析目标文字列表
            targets = re.split(r"[\s、,，]+", target_text.strip())
            targets = [t for t in targets if t]

            if not targets:
                return CaptchaResult(
                    success=False,
                    captcha_type=CaptchaType.CLICK_ORDER,
                    error="目标文字为空",
                )

            # 裁剪每个检测区域并 OCR 识别
            from PIL import Image
            img = Image.open(BytesIO(bg_image))
            w, h = img.size

            # 每个点的 OCR 结果
            point_texts = []
            for cx, cy in click_points:
                # 裁剪以点击中心为中心的区域
                crop_size = 60
                x1 = max(0, cx - crop_size)
                y1 = max(0, cy - crop_size)
                x2 = min(w, cx + crop_size)
                y2 = min(h, cy + crop_size)
                cropped = img.crop((x1, y1, x2, y2))

                # 转 bytes 并 OCR
                buf = BytesIO()
                cropped.save(buf, format="PNG")
                text = self._dddd_ocr.classification(buf.getvalue())
                point_texts.append(text)

            # 匹配目标顺序
            ordered_points = []
            for target in targets:
                best_match = None
                best_score = 0
                for i, pt_text in enumerate(point_texts):
                    if i in [p[0] for p in ordered_points]:
                        continue
                    # 简单的字符匹配评分
                    score = self._text_similarity(target, pt_text)
                    if score > best_score:
                        best_score = score
                        best_match = i

                if best_match is not None:
                    ordered_points.append((best_match, click_points[best_match]))

            result_points = [p[1] for p in ordered_points]

            return CaptchaResult(
                success=True,
                captcha_type=CaptchaType.CLICK_ORDER,
                answer=result_points,
                details={
                    "targets": targets,
                    "ocr_results": point_texts,
                    "provider": "geetest",
                },
            )

        except Exception as e:
            return CaptchaResult(
                success=False,
                captcha_type=CaptchaType.CLICK_ORDER,
                error=f"GeeTest 语序点选异常: {e}",
            )

    @staticmethod
    def _text_similarity(s1: str, s2: str) -> float:
        """简单的文字相似度评分"""
        if not s1 or not s2:
            return 0.0
        # 计算交集字符数
        set1 = set(s1)
        set2 = set(s2)
        intersection = set1 & set2
        union = set1 | set2
        return len(intersection) / len(union) if union else 0.0

    def solve_via_api(
        self,
        gt: str,
        challenge: str,
        page_url: str,
        api_key: str,
        platform: str = "capsolver",
    ) -> CaptchaResult:
        """
        通过第三方 API 解决 GeeTest 验证码。

        :param gt:        GeeTest gt 参数
        :param challenge: GeeTest challenge 参数
        :param page_url:  页面 URL
        :param api_key:   API Key
        :param platform:  平台
        :return: CaptchaResult，answer 为 dict: {challenge, validate, seccode}
        """
        import requests
        try:
            if platform in ("capsolver", "yescaptcha"):
                submit_url = (
                    "https://api.capsolver.com/createTask"
                    if platform == "capsolver"
                    else "https://api.yescaptcha.com/createTask"
                )
                result_url = (
                    "https://api.capsolver.com/getTaskResult"
                    if platform == "capsolver"
                    else "https://api.yescaptcha.com/getTaskResult"
                )

                # 创建任务
                resp = requests.post(submit_url, json={
                    "clientKey": api_key,
                    "task": {
                        "type": "GeetestTaskProxyLess",
                        "websiteURL": page_url,
                        "gt": gt,
                        "challenge": challenge,
                    },
                }, timeout=30)
                data = resp.json()

                if data.get("errorId") != 0:
                    return CaptchaResult(
                        success=False,
                        error=f"{platform} 提交失败: {data.get('errorDescription')}",
                    )

                task_id = data.get("taskId")
                time.sleep(5)

                # 轮询
                start = time.time()
                while time.time() - start < 120:
                    resp = requests.post(result_url, json={
                        "clientKey": api_key,
                        "taskId": task_id,
                    }, timeout=15)
                    data = resp.json()
                    if data.get("status") == "ready":
                        solution = data.get("solution", {})
                        return CaptchaResult(
                            success=True,
                            answer={
                                "challenge": solution.get("challenge", challenge),
                                "validate": solution.get("validate", ""),
                                "seccode": solution.get("seccode", ""),
                            },
                            details={"task_id": task_id},
                        )
                    elif data.get("status") == "processing":
                        time.sleep(3)
                    else:
                        return CaptchaResult(
                            success=False,
                            error=f"{platform} 错误: {data.get('errorDescription')}",
                        )

                return CaptchaResult(success=False, error="轮询超时")

            elif platform == "2captcha":
                resp = requests.post("https://2captcha.com/in.php", data={
                    "key": api_key,
                    "method": "geetest",
                    "gt": gt,
                    "challenge": challenge,
                    "pageurl": page_url,
                    "json": 1,
                }, timeout=30)
                data = resp.json()
                if data.get("status") != 1:
                    return CaptchaResult(
                        success=False,
                        error=f"2captcha 提交失败: {data.get('request')}",
                    )

                task_id = data["request"]
                time.sleep(10)

                start = time.time()
                while time.time() - start < 120:
                    resp = requests.get("https://2captcha.com/res.php", params={
                        "key": api_key, "action": "get", "id": task_id, "json": 1,
                    }, timeout=15)
                    data = resp.json()
                    if data.get("status") == 1:
                        # 2captcha 返回 JSON 字符串
                        result = json.loads(data["request"])
                        return CaptchaResult(
                            success=True,
                            answer=result,
                            details={"task_id": task_id},
                        )
                    elif data.get("request") == "CAPCHA_NOT_READY":
                        time.sleep(5)
                    else:
                        return CaptchaResult(
                            success=False,
                            error=f"2captcha 错误: {data.get('request')}",
                        )

                return CaptchaResult(success=False, error="轮询超时")

            else:
                return CaptchaResult(
                    success=False,
                    error=f"不支持的平台: {platform}",
                )

        except Exception as e:
            return CaptchaResult(
                success=False,
                error=f"GeeTest API 异常: {e}",
            )


# ===========================================================================
# AWS WAF 验证码求解器
# ===========================================================================
class AWSWAFCaptchaSolver:
    """
    AWS WAF 验证码求解器。

    AWS WAF Captcha 是 Amazon Web Services 提供的验证码服务，
    通常表现为一个拼图或图形识别挑战。

    支持方式:
      1. 第三方 API 解决 (2captcha / capsolver)
      2. 本地图片识别 (ddddocr)

    参考:
      - https://2captcha.com/p/aws-waf
      - https://capsolver.com/blog/AWSWAF/how-to-solve-awswaf
    """

    def __init__(self, use_gpu: bool = False):
        self.use_gpu = use_gpu

    def solve_via_api(
        self,
        site_key: str,
        page_url: str,
        iv: str = "",
        context: str = "",
        api_key: str = "",
        platform: str = "capsolver",
    ) -> CaptchaResult:
        """
        通过第三方 API 解决 AWS WAF 验证码。

        :param site_key: AWS WAF site key
        :param page_url: 页面 URL
        :param iv:       AWS WAF iv 参数（可选）
        :param context:  AWS WAF context 参数（可选）
        :param api_key:  API Key
        :param platform: 平台
        :return: CaptchaResult，answer 为 token
        """
        import requests
        try:
            if platform in ("capsolver", "yescaptcha"):
                submit_url = (
                    "https://api.capsolver.com/createTask"
                    if platform == "capsolver"
                    else "https://api.yescaptcha.com/createTask"
                )
                result_url = submit_url.replace("createTask", "getTaskResult")

                task = {
                    "type": "AwsCaptchaTaskProxyLess",
                    "websiteURL": page_url,
                    "websiteKey": site_key,
                }
                if iv:
                    task["iv"] = iv
                if context:
                    task["context"] = context

                resp = requests.post(submit_url, json={
                    "clientKey": api_key,
                    "task": task,
                }, timeout=30)
                data = resp.json()

                if data.get("errorId") != 0:
                    return CaptchaResult(
                        success=False,
                        error=f"{platform} 提交失败: {data.get('errorDescription')}",
                    )

                task_id = data.get("taskId")
                time.sleep(5)

                start = time.time()
                while time.time() - start < 120:
                    resp = requests.post(result_url, json={
                        "clientKey": api_key, "taskId": task_id,
                    }, timeout=15)
                    data = resp.json()
                    if data.get("status") == "ready":
                        solution = data.get("solution", {})
                        token = solution.get("token", "")
                        return CaptchaResult(
                            success=True,
                            answer=token,
                            details={"task_id": task_id, "solution": solution},
                        )
                    elif data.get("status") == "processing":
                        time.sleep(3)
                    else:
                        return CaptchaResult(
                            success=False,
                            error=f"{platform} 错误: {data.get('errorDescription')}",
                        )

                return CaptchaResult(success=False, error="轮询超时")

            else:
                return CaptchaResult(
                    success=False,
                    error=f"不支持的平台: {platform}",
                )

        except Exception as e:
            return CaptchaResult(
                success=False,
                error=f"AWS WAF API 异常: {e}",
            )


# ===========================================================================
# 通用图像分类器 (CLIP / ONNX)
# ===========================================================================
class ImageClassifier:
    """
    通用图像分类器，用于验证码图片内容识别。

    支持多种后端:
      1. hcaptcha-challenger (ONNX MoE) —— 本地，免费
      2. ddddocr 目标检测                  —— 本地，免费
      3. 第三方 API                       —— 付费

    主要用途:
      - hCaptcha 九宫格分类
      - reCAPTCHA 图片匹配
      - 通用图片内容识别
    """

    def __init__(self, backend: str = "ddddocr", use_gpu: bool = False):
        """
        :param backend: 后端 ("ddddocr" / "hcaptcha_challenger" / "api")
        :param use_gpu: 是否使用 GPU
        """
        self.backend = backend
        self.use_gpu = use_gpu
        self._dddd_det = None
        self._hc_solver = None

    def _init_ddddocr(self):
        if self._dddd_det is not None:
            return
        try:
            import ddddocr
            self._dddd_det = ddddocr.DdddOcr(
                det=True, ocr=False, show_ad=False, use_gpu=self.use_gpu
            )
        except ImportError:
            raise ImportError("ddddocr 未安装")

    def _init_hcaptcha(self):
        if self._hc_solver is not None:
            return
        self._hc_solver = HCaptchaGridSolver(use_gpu=self.use_gpu)

    def classify(
        self,
        prompt: str,
        images: List[bytes],
    ) -> List[bool]:
        """
        对图片列表进行二分类: 是否匹配 prompt 描述。

        :param prompt:  分类提示，如 "包含火车的图片"
        :param images:  图片列表
        :return: 布尔列表
        """
        if self.backend == "hcaptcha_challenger":
            self._init_hcaptcha()
            result = self._hc_solver.classify_images(prompt, images)
            return result.answer if result.success else [False] * len(images)

        elif self.backend == "ddddocr":
            # ddddocr 不直接支持 prompt 分类，退化为目标检测
            self._init_ddddocr()
            results = []
            for img in images:
                bboxes = self._dddd_det.detection(img)
                # 有检测到目标即认为匹配
                results.append(len(bboxes) > 0)
            return results

        else:
            logger.warning(f"未知后端: {self.backend}")
            return [False] * len(images)

    def detect_objects(self, image: bytes) -> List[Tuple[int, int, int, int]]:
        """
        检测图片中的目标位置。

        :param image: 图片二进制
        :return: bbox 列表 [(x1, y1, x2, y2), ...]
        """
        self._init_ddddocr()
        return self._dddd_det.detection(image)


# ===========================================================================
# hCaptcha 浏览器自动化求解器 (Playwright + hcaptcha-challenger)
# ===========================================================================
class HCaptchaBrowserSolver:
    """
    hCaptcha 浏览器自动化求解器。

    使用 Playwright 操控浏览器，结合 hcaptcha-challenger 的 ONNX 模型
    自动完成 hCaptcha 的九宫格/二宫格图片选择挑战。

    工作流程:
        1. 启动浏览器访问目标页面
        2. 定位 hCaptcha iframe 并触发挑战
        3. 提取挑战问题文字和九宫格图片
        4. 用 ONNX 模型对每张图片进行分类
        5. 自动点击匹配的图片
        6. 提交并获取 h-captcha-response token

    依赖:
        pip install hcaptcha-challenger playwright
        playwright install chromium

    参考:
        - https://github.com/QIN2DIM/hcaptcha-challenger
        - https://blog.skk.moe/post/bypass-hcaptcha/
    """

    def __init__(
        self,
        use_gpu: bool = False,
        headless: bool = True,
        proxy: Optional[str] = None,
        lang: str = "zh-CN",
    ):
        """
        :param use_gpu:  ONNX 推理是否使用 GPU
        :param headless: 浏览器是否无头模式
        :param proxy:    代理地址 (如 "socks5://127.0.0.1:7890")
        :param lang:     浏览器语言
        """
        self.use_gpu = use_gpu
        self.headless = headless
        self.proxy = proxy
        self.lang = lang
        self._grid_solver = HCaptchaGridSolver(use_gpu=use_gpu)

    def solve(
        self,
        page_url: str,
        site_key: str = "",
        max_retries: int = 3,
    ) -> CaptchaResult:
        """
        在浏览器中自动解决 hCaptcha。

        :param page_url:   目标页面 URL
        :param site_key:   hCaptcha sitekey（可选，可从页面自动提取）
        :param max_retries: 最大重试次数
        :return: CaptchaResult，answer 为 h-captcha-response token
        """
        try:
            from playwright.sync_api import sync_playwright
        except ImportError:
            return CaptchaResult(
                success=False,
                captcha_type=CaptchaType.HCAPTCHA,
                error="playwright 未安装 (pip install playwright && playwright install chromium)",
            )

        try:
            with sync_playwright() as p:
                # 启动浏览器
                launch_args = {"headless": self.headless}
                if self.proxy:
                    launch_args["proxy"] = {"server": self.proxy}

                browser = p.chromium.launch(**launch_args)
                context = browser.new_context(
                    locale=self.lang,
                    user_agent=(
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) "
                        "Chrome/120.0.0.0 Safari/537.36"
                    ),
                )
                page = context.new_page()

                # 访问页面
                page.goto(page_url, wait_until="networkidle", timeout=30000)

                # 等待 hCaptcha iframe 加载
                hcaptcha_frame = self._wait_for_hcaptcha(page)
                if not hcaptcha_frame:
                    return CaptchaResult(
                        success=False,
                        captcha_type=CaptchaType.HCAPTCHA,
                        error="未找到 hCaptcha iframe",
                    )

                # 尝试解决挑战（最多 max_retries 次）
                for attempt in range(max_retries):
                    token = self._solve_challenge(page, hcaptcha_frame)
                    if token:
                        browser.close()
                        return CaptchaResult(
                            success=True,
                            captcha_type=CaptchaType.HCAPTCHA,
                            answer=token,
                            details={"attempts": attempt + 1},
                        )
                    logger.info(f"hCaptcha 第 {attempt + 1} 次尝试失败，重试...")

                browser.close()
                return CaptchaResult(
                    success=False,
                    captcha_type=CaptchaType.HCAPTCHA,
                    error=f"超过最大重试次数 {max_retries}",
                )

        except Exception as e:
            return CaptchaResult(
                success=False,
                captcha_type=CaptchaType.HCAPTCHA,
                error=f"浏览器求解异常: {e}",
            )

    def _wait_for_hcaptcha(self, page, timeout: int = 15000):
        """等待 hCaptcha iframe 出现并返回 frame"""
        import time
        start = time.time()
        while time.time() - start < timeout / 1000:
            for frame in page.frames:
                if "hcaptcha" in frame.url.lower():
                    return frame
            time.sleep(0.5)
        return None

    def _solve_challenge(self, page, hcaptcha_frame) -> Optional[str]:
        """
        解决单次 hCaptcha 挑战。

        1. 点击复选框触发挑战
        2. 提取问题文字和九宫格图片
        3. 用 ONNX 模型分类
        4. 点击匹配的图片
        5. 提交并检查是否通过
        """
        try:
            # 点击 hCaptcha 复选框
            checkbox = hcaptcha_frame.query_selector("#checkbox")
            if checkbox:
                checkbox.click()
                page.wait_for_timeout(2000)

            # 检查是否直接通过（有时不需要图片挑战）
            token = self._extract_token(page)
            if token:
                return token

            # 等待挑战图片加载
            challenge_frame = None
            for frame in page.frames:
                if "hcaptcha" in frame.url.lower() and "challenge" in frame.url.lower():
                    challenge_frame = frame
                    break

            if not challenge_frame:
                # 再次尝试从所有 frames 中找
                for frame in page.frames:
                    if "hcaptcha" in frame.url.lower():
                        challenge_frame = frame
                        break

            if not challenge_frame:
                return None

            # 提取挑战问题文字
            prompt = self._extract_prompt(challenge_frame)
            if not prompt:
                logger.warning("未能提取 hCaptcha 挑战问题")
                return None

            # 提取九宫格图片
            images = self._extract_grid_images(challenge_frame)
            if not images:
                logger.warning("未能提取 hCaptcha 九宫格图片")
                return None

            # 用 ONNX 模型分类
            result = self._grid_solver.classify_images(prompt, images)
            if not result.success:
                return None

            # 点击匹配的图片
            answers = result.answer
            task_images = challenge_frame.query_selector_all(".task-image")
            for i, should_click in enumerate(answers):
                if should_click and i < len(task_images):
                    task_images[i].click()
                    page.wait_for_timeout(300)

            # 点击提交按钮
            submit_btn = challenge_frame.query_selector(".button-submit")
            if submit_btn:
                submit_btn.click()
                page.wait_for_timeout(3000)

            # 检查是否通过
            return self._extract_token(page)

        except Exception as e:
            logger.warning(f"hCaptcha 挑战异常: {e}")
            return None

    def _extract_prompt(self, frame) -> str:
        """从挑战 frame 中提取问题文字"""
        try:
            prompt_el = frame.query_selector(".prompt-text")
            if prompt_el:
                return prompt_el.inner_text().strip()
        except Exception:
            pass
        return ""

    def _extract_grid_images(self, frame) -> List[bytes]:
        """从挑战 frame 中提取九宫格图片"""
        images = []
        try:
            task_images = frame.query_selector_all(".task-image .image")
            for img_el in task_images:
                # 获取图片的 background-image 或 src
                style = img_el.get_attribute("style") or ""
                src = img_el.get_attribute("src") or ""

                if src:
                    # 直接下载图片
                    import requests
                    resp = requests.get(src, timeout=10)
                    if resp.status_code == 200:
                        images.append(resp.content)
                elif "url(" in style:
                    # 从 style 中提取 URL
                    import re
                    match = re.search(r"url\(['\"]?(.*?)['\"]?\)", style)
                    if match:
                        url = match.group(1)
                        import requests
                        resp = requests.get(url, timeout=10)
                        if resp.status_code == 200:
                            images.append(resp.content)
        except Exception as e:
            logger.warning(f"提取图片异常: {e}")
        return images

    def _extract_token(self, page) -> Optional[str]:
        """从页面中提取 h-captcha-response token"""
        try:
            token = page.evaluate("""
                () => {
                    const el = document.querySelector('[name="h-captcha-response"]')
                        || document.querySelector('textarea[name="h-captcha-response"]');
                    return el ? el.value : '';
                }
            """)
            if token and len(token) > 10:
                return token
        except Exception:
            pass
        return None


# ===========================================================================
# GeeTest V4 验证码求解器
# ===========================================================================
class GeeTestV4Solver:
    """
    极验第四代验证码求解器。

    GeeTest V4 与 V3 的主要区别:
      - 使用 captcha_id 替代 gt
      - 使用 lot_number 替代 challenge
      - API 参数和流程不同

    支持方式:
      1. 第三方 API (capsolver / yescaptcha / 2captcha)
      2. 本地图片识别 (滑块/点选)

    参考:
      - https://docs.geetest.com/gt4/apireferences/web/waiver
      - https://capsolver.com/blog/Geetest/how-to-solve-geetest-v4
    """

    def __init__(self, use_gpu: bool = False):
        self.use_gpu = use_gpu

    def solve_via_api(
        self,
        captcha_id: str,
        page_url: str,
        lot_number: str = "",
        api_key: str = "",
        platform: str = "capsolver",
    ) -> CaptchaResult:
        """
        通过第三方 API 解决 GeeTest V4 验证码。

        :param captcha_id: GeeTest V4 captcha_id
        :param page_url:   页面 URL
        :param lot_number: GeeTest V4 lot_number（可选）
        :param api_key:    API Key
        :param platform:   打码平台
        :return: CaptchaResult，answer 为 dict
        """
        import requests
        try:
            if platform in ("capsolver", "yescaptcha"):
                submit_url = (
                    "https://api.capsolver.com/createTask"
                    if platform == "capsolver"
                    else "https://api.yescaptcha.com/createTask"
                )
                result_url = submit_url.replace("createTask", "getTaskResult")

                task = {
                    "type": "GeeTestV4TaskProxyLess",
                    "websiteURL": page_url,
                    "captchaId": captcha_id,
                }
                if lot_number:
                    task["lotNumber"] = lot_number

                resp = requests.post(submit_url, json={
                    "clientKey": api_key,
                    "task": task,
                }, timeout=30)
                data = resp.json()

                if data.get("errorId") != 0:
                    return CaptchaResult(
                        success=False,
                        captcha_type=CaptchaType.GEETEST_V4,
                        error=f"{platform} 提交失败: {data.get('errorDescription')}",
                    )

                task_id = data.get("taskId")
                time.sleep(5)

                # 轮询
                start = time.time()
                while time.time() - start < 120:
                    resp = requests.post(result_url, json={
                        "clientKey": api_key,
                        "taskId": task_id,
                    }, timeout=15)
                    data = resp.json()
                    if data.get("status") == "ready":
                        solution = data.get("solution", {})
                        return CaptchaResult(
                            success=True,
                            captcha_type=CaptchaType.GEETEST_V4,
                            answer={
                                "captcha_id": captcha_id,
                                "lot_number": solution.get("lotNumber", lot_number),
                                "pass_token": solution.get("passToken", ""),
                                "gen_time": solution.get("genTime", ""),
                                "captcha_output": solution.get("captchaOutput", ""),
                            },
                            details={"task_id": task_id},
                        )
                    elif data.get("status") == "processing":
                        time.sleep(3)
                    else:
                        return CaptchaResult(
                            success=False,
                            captcha_type=CaptchaType.GEETEST_V4,
                            error=f"{platform} 错误: {data.get('errorDescription')}",
                        )

                return CaptchaResult(
                    success=False,
                    captcha_type=CaptchaType.GEETEST_V4,
                    error="轮询超时",
                )

            else:
                return CaptchaResult(
                    success=False,
                    captcha_type=CaptchaType.GEETEST_V4,
                    error=f"不支持的平台: {platform}",
                )

        except Exception as e:
            return CaptchaResult(
                success=False,
                captcha_type=CaptchaType.GEETEST_V4,
                error=f"GeeTest V4 API 异常: {e}",
            )


# ===========================================================================
# FunCaptcha (Arkose Labs) 求解器
# ===========================================================================
class FunCaptchaSolver:
    """
    FunCaptcha / Arkose Labs 验证码求解器。

    FunCaptcha 通常表现为 3D 旋转、图片匹配等交互式挑战。
    支持 token 模式（第三方 API）和图片模式（本地识别）。

    支持方式:
      1. 第三方 API (capsolver / yescaptcha / 2captcha)
         - 直接获取已解决的 token
      2. 本地图片识别 (ddddocr)
         - 适用于简单的图片匹配类型

    参考:
      - https://2captcha.com/p/funcaptcha
      - https://capsolver.com/blog/Funcaptcha/how-to-solve-funcaptcha
    """

    # Arkose Labs 公共参数提取正则
    PK_PATTERN = r"pkey=([A-Fa-f0-9-]{36})"
    DATA_PATTERN = r'data-pkey="([^"]+)"'

    def __init__(self, use_gpu: bool = False):
        self.use_gpu = use_gpu

    def solve_via_api(
        self,
        public_key: str,
        page_url: str,
        service_url: str = "",
        api_key: str = "",
        platform: str = "capsolver",
    ) -> CaptchaResult:
        """
        通过第三方 API 解决 FunCaptcha。

        :param public_key: Arkose Labs public key
        :param page_url:   页面 URL
        :param service_url: Arkose API JS 子域名（可选）
        :param api_key:    API Key
        :param platform:   打码平台
        :return: CaptchaResult，answer 为 token
        """
        import requests
        try:
            if platform in ("capsolver", "yescaptcha"):
                submit_url = (
                    "https://api.capsolver.com/createTask"
                    if platform == "capsolver"
                    else "https://api.yescaptcha.com/createTask"
                )
                result_url = submit_url.replace("createTask", "getTaskResult")

                task = {
                    "type": "FunCaptchaTaskProxyless",
                    "websiteURL": page_url,
                    "websitePublicKey": public_key,
                }
                if service_url:
                    task["funcaptchaApiJSSubdomain"] = service_url

                resp = requests.post(submit_url, json={
                    "clientKey": api_key,
                    "task": task,
                }, timeout=30)
                data = resp.json()

                if data.get("errorId") != 0:
                    return CaptchaResult(
                        success=False,
                        captcha_type=CaptchaType.FUNCAPTCHA,
                        error=f"{platform} 提交失败: {data.get('errorDescription')}",
                    )

                task_id = data.get("taskId")
                time.sleep(5)

                start = time.time()
                while time.time() - start < 120:
                    resp = requests.post(result_url, json={
                        "clientKey": api_key,
                        "taskId": task_id,
                    }, timeout=15)
                    data = resp.json()
                    if data.get("status") == "ready":
                        solution = data.get("solution", {})
                        token = solution.get("token", "")
                        return CaptchaResult(
                            success=True,
                            captcha_type=CaptchaType.FUNCAPTCHA,
                            answer=token,
                            details={
                                "task_id": task_id,
                                "user_agent": solution.get("userAgent", ""),
                            },
                        )
                    elif data.get("status") == "processing":
                        time.sleep(3)
                    else:
                        return CaptchaResult(
                            success=False,
                            captcha_type=CaptchaType.FUNCAPTCHA,
                            error=f"{platform} 错误: {data.get('errorDescription')}",
                        )

                return CaptchaResult(
                    success=False,
                    captcha_type=CaptchaType.FUNCAPTCHA,
                    error="轮询超时",
                )

            elif platform == "2captcha":
                # 2captcha FunCaptcha
                data_params = {
                    "key": api_key,
                    "method": "funcaptcha",
                    "publickey": public_key,
                    "pageurl": page_url,
                    "json": 1,
                }
                if service_url:
                    data_params["surl"] = service_url

                resp = requests.post("https://2captcha.com/in.php", data=data_params, timeout=30)
                data = resp.json()
                if data.get("status") != 1:
                    return CaptchaResult(
                        success=False,
                        captcha_type=CaptchaType.FUNCAPTCHA,
                        error=f"2captcha 提交失败: {data.get('request')}",
                    )

                task_id = data["request"]
                time.sleep(10)

                start = time.time()
                while time.time() - start < 120:
                    resp = requests.get("https://2captcha.com/res.php", params={
                        "key": api_key, "action": "get", "id": task_id, "json": 1,
                    }, timeout=15)
                    data = resp.json()
                    if data.get("status") == 1:
                        return CaptchaResult(
                            success=True,
                            captcha_type=CaptchaType.FUNCAPTCHA,
                            answer=data["request"],
                            details={"task_id": task_id},
                        )
                    elif data.get("request") == "CAPCHA_NOT_READY":
                        time.sleep(5)
                    else:
                        return CaptchaResult(
                            success=False,
                            captcha_type=CaptchaType.FUNCAPTCHA,
                            error=f"2captcha 错误: {data.get('request')}",
                        )

                return CaptchaResult(
                    success=False,
                    captcha_type=CaptchaType.FUNCAPTCHA,
                    error="轮询超时",
                )

            else:
                return CaptchaResult(
                    success=False,
                    captcha_type=CaptchaType.FUNCAPTCHA,
                    error=f"不支持的平台: {platform}",
                )

        except Exception as e:
            return CaptchaResult(
                success=False,
                captcha_type=CaptchaType.FUNCAPTCHA,
                error=f"FunCaptcha API 异常: {e}",
            )

    @classmethod
    def extract_public_key(cls, html: str) -> Optional[str]:
        """
        从页面 HTML 中提取 FunCaptcha public key。

        :param html: 页面 HTML
        :return: public key 或 None
        """
        # 尝试 data-pkey 属性
        match = re.search(cls.DATA_PATTERN, html)
        if match:
            return match.group(1)

        # 尝试 URL 中的 pk 参数
        match = re.search(cls.PK_PATTERN, html)
        if match:
            return match.group(1)

        return None


# ===========================================================================
# reCAPTCHA 图片分类求解器
# ===========================================================================
class ReCaptchaImageSolver:
    """
    reCAPTCHA v2 图片分类求解器。

    reCAPTCHA v2 的图片挑战通常要求从 3x3 或 4x4 网格中选择
    符合描述的图片（如"选择所有包含交通灯的图片"）。

    支持方式:
      1. hcaptcha-challenger ONNX 模型（本地）
      2. ddddocr 目标检测（本地，精度较低）
      3. 第三方 API 图片分类

    参考:
      - https://github.com/QIN2DIM/hcaptcha-challenger (模型可复用于 reCAPTCHA)
      - https://zhuanlan.zhihu.com/p/521583792
    """

    # reCAPTCHA 常见挑战类型映射
    CHALLENGE_TYPES = {
        "traffic light": "交通灯",
        "crosswalk": "人行横道",
        "fire hydrant": "消防栓",
        "bicycle": "自行车",
        "bus": "公交车",
        "car": "汽车",
        "motorcycle": "摩托车",
        "boat": "船",
        "stairs": "楼梯",
        "bridge": "桥",
        "mountain": "山",
        "parking meter": "停车计时器",
        "street sign": "路标",
        "taxi": "出租车",
        "tractor": "拖拉机",
        "traffic light": "交通灯",
    }

    def __init__(self, backend: str = "hcaptcha_challenger", use_gpu: bool = False):
        """
        :param backend: 后端 ("hcaptcha_challenger" / "ddddocr")
        :param use_gpu: 是否使用 GPU
        """
        self.backend = backend
        self.use_gpu = use_gpu
        self._classifier = None

    def _init_classifier(self):
        if self._classifier is not None:
            return
        self._classifier = ImageClassifier(backend=self.backend, use_gpu=self.use_gpu)

    def classify_tiles(
        self,
        prompt: str,
        tiles: List[bytes],
    ) -> CaptchaResult:
        """
        对 reCAPTCHA 的网格图片进行分类。

        :param prompt: 挑战描述，如 "Select all images with traffic lights"
        :param tiles:  网格图片列表（通常 9 或 16 张）
        :return: CaptchaResult，answer 为 List[bool]
        """
        try:
            self._init_classifier()

            # 翻译英文提示为中文（hcaptcha-challenger 模型主要用中文训练）
            translated_prompt = self._translate_prompt(prompt)

            results = self._classifier.classify(translated_prompt, tiles)

            return CaptchaResult(
                success=True,
                captcha_type=CaptchaType.RECAPTCHA_V2,
                answer=results,
                details={
                    "prompt": prompt,
                    "translated": translated_prompt,
                    "tile_count": len(tiles),
                    "matched": sum(results),
                },
            )

        except Exception as e:
            return CaptchaResult(
                success=False,
                captcha_type=CaptchaType.RECAPTCHA_V2,
                error=f"reCAPTCHA 图片分类异常: {e}",
            )

    def _translate_prompt(self, prompt: str) -> str:
        """将英文挑战描述翻译为中文"""
        prompt_lower = prompt.lower()
        for en, zh in self.CHALLENGE_TYPES.items():
            if en in prompt_lower:
                return f"请选择包含{zh}的图片"
        return prompt


# ===========================================================================
# 图片差异滑块求解器 (前图+后图模式)
# ===========================================================================
class SlideComparisonSolver:
    """
    图片差异滑块验证码求解器。

    适用于"前图+后图"模式的滑块验证码:
      - 前图: 完整的无缺口背景图
      - 后图: 有缺口的背景图
      - 通过比较两张图找出缺口位置

    使用 ddddocr 的 slide_comparison 算法。

    参考:
      - https://github.com/sml2h3/ddddocr
      - https://www.cnblogs.com/cuihongyu3503319/p/17620692.html
    """

    def __init__(self, use_gpu: bool = False):
        self.use_gpu = use_gpu
        self._solver = None

    def _init_solver(self):
        if self._solver is not None:
            return
        try:
            import ddddocr
            self._solver = ddddocr.DdddOcr(
                ocr=False, det=False, use_gpu=self.use_gpu, show_ad=False
            )
            logger.info("ddddocr 滑块比较模型已加载")
        except ImportError:
            raise ImportError("ddddocr 未安装 (pip install ddddocr)")

    def solve(
        self,
        full_image: bytes,
        gap_image: bytes,
    ) -> CaptchaResult:
        """
        通过图片差异检测滑块缺口位置。

        :param full_image: 完整背景图（无缺口）
        :param gap_image:  有缺口的背景图
        :return: CaptchaResult，answer 为缺口 X 坐标
        """
        try:
            self._init_solver()

            result = self._solver.slide_comparison(full_image, gap_image)
            # ddddocr 返回 {"target": [x, y], "target_x": x, "target_y": y}
            target = result.get("target") or []
            target_x = result.get("target_x", target[0] if len(target) > 0 else 0)
            target_y = result.get("target_y", target[1] if len(target) > 1 else 0)
            target_w = target[2] if len(target) > 2 else None
            target_h = target[3] if len(target) > 3 else None

            logger.info(f"图片差异缺口: x={target_x}, y={target_y}, w={target_w}, h={target_h}")

            # 生成滑动轨迹
            from .captcha import SlideCaptchaSolver
            slide_solver = SlideCaptchaSolver(use_gpu=self.use_gpu)
            track = slide_solver._generate_track(target_x)

            return CaptchaResult(
                success=True,
                captcha_type=CaptchaType.SLIDE,
                answer=target_x,
                details={
                    "track": track,
                    "target": {
                        "x": target_x,
                        "y": target_y,
                        "w": target_w,
                        "h": target_h,
                    },
                    "algorithm": "comparison",
                },
            )

        except Exception as e:
            return CaptchaResult(
                success=False,
                captcha_type=CaptchaType.SLIDE,
                error=f"图片差异滑块识别异常: {e}",
            )


# ===========================================================================
# 旋转验证码求解器
# ===========================================================================
class RotateCaptchaSolver:
    """
    旋转验证码求解器（调整图片/文字方向）。

    适用于"拖动滑块让文字转正"类验证码，也支持量化到
    0/90/180/270 度的"点击旋转按钮"类验证码。

    原理（轻量，无模型）：
      文字/含明显结构的内容在转正后，边缘方向会集中于水平/垂直。
      对图像做 Canny 边缘检测 + Hough 直线检测，按线段长度加权统计
      方向直方图，主方向偏离水平的角度即为需要转正的角度。

    依赖：opencv-python + numpy（ddddocr 的传递依赖，通常已安装）。

    局限：
      边缘方向直方图依赖图像存在明显的直线/文字结构，适合文字旋转码。
      对纯自然场景的"图片正立判断"（如把一只猫转正）效果有限，
      此类语义旋转码建议走 CLIP 方向分类或付费打码平台。
    """

    def __init__(self, use_gpu: bool = False):
        self.use_gpu = use_gpu

    def solve(self, image_bytes: bytes, quantize: bool = False, **kwargs) -> CaptchaResult:
        """
        识别旋转验证码的转正角度。

        :param image_bytes: 旋转验证码图片二进制
        :param quantize:    True 时把结果量化到 0/90/180/270（点击旋转按钮类）
                            False 时返回连续角度（拖动滑块类）
        :return: CaptchaResult，answer 为需要顺时针旋转的角度（度）
        """
        try:
            import math
            import numpy as np
            import cv2
        except ImportError as e:
            return CaptchaResult(
                success=False,
                captcha_type=CaptchaType.ROTATE,
                error=f"旋转识别需要 opencv-python 与 numpy: {e}",
            )

        try:
            img = cv2.imdecode(np.frombuffer(image_bytes, np.uint8), cv2.IMREAD_GRAYSCALE)
            if img is None:
                return CaptchaResult(
                    success=False,
                    captcha_type=CaptchaType.ROTATE,
                    error="无法解码图片",
                )

            edges = cv2.Canny(img, 50, 150)
            lines = cv2.HoughLinesP(
                edges, 1, np.pi / 180, threshold=50,
                minLineLength=30, maxLineGap=10,
            )
            if lines is None or len(lines) == 0:
                return CaptchaResult(
                    success=False,
                    captcha_type=CaptchaType.ROTATE,
                    error="未检测到有效边缘方向",
                )

            # 按线段长度加权的方向直方图（角度映射到 [0, 180)）
            hist = np.zeros(180, dtype=np.float64)
            for x1, y1, x2, y2 in lines.reshape(-1, 4):
                dx, dy = x2 - x1, y2 - y1
                length = math.hypot(dx, dy)
                if length < 1:
                    continue
                angle = math.degrees(math.atan2(dy, dx)) % 180.0
                hist[int(round(angle)) % 180] += length

            # 平滑后取主方向
            kernel = np.ones(5) / 5.0
            smoothed = np.convolve(hist, kernel, mode="same")
            main_angle = float(np.argmax(smoothed))

            # 需要顺时针旋转的角度（把主方向转到水平）
            clockwise = -main_angle if main_angle <= 90 else 180 - main_angle

            if quantize:
                clockwise = int(round(clockwise / 90.0)) * 90 % 360
            else:
                clockwise = round(clockwise, 1)

            logger.info(
                f"旋转验证码主方向: {main_angle:.1f}°, 顺时针转正: {clockwise}°"
            )

            return CaptchaResult(
                success=True,
                captcha_type=CaptchaType.ROTATE,
                answer=clockwise,
                details={
                    "main_angle": round(main_angle, 1),
                    "clockwise": clockwise,
                    "quantized": bool(quantize),
                    "algorithm": "edge_direction_histogram",
                },
            )

        except Exception as e:
            return CaptchaResult(
                success=False,
                captcha_type=CaptchaType.ROTATE,
                error=f"旋转识别异常: {e}",
            )


# ===========================================================================
# GeeTest v4 浏览器内自动化求解器
# ===========================================================================
class GeeTestBrowserSolver:
    """
    GeeTest v4 浏览器内自动化求解器（DrissionPage 驱动，无需第三方打码平台）。

    复用真实浏览器 profile（user_data_dir）在真实 Chrome 中自动完成
    GeeTest v4 滑块验证：截图识别缺口 + 拟人轨迹拖动。

    工作流程:
        1. 连接真实浏览器访问目标页面
        2. 等待 GeeTest 验证面板出现
        3. 截取背景图与滑块图（canvas）
        4. SlideCaptchaSolver 识别缺口 + 生成人类轨迹
        5. 按轨迹分步拖动滑块
        6. 轮询验证结果，失败重试

    注意:
        GeeTest v4 的 DOM 结构随版本与站点变化，默认选择器集中定义在
        SELECTORS 类属性中，可针对具体站点覆盖调整。

    依赖:
        pip install DrissionPage ddddocr
    """

    # GeeTest 常见 DOM 选择器（可按站点覆盖）
    SELECTORS = {
        "bg_canvas": "css:.geetest_canvas_bg canvas, canvas.geetest_canvas_bg",
        "slice_canvas": "css:.geetest_canvas_slice canvas, canvas.geetest_canvas_slice",
        "slider_button": "css:.geetest_slider_button",
    }

    def __init__(
        self,
        use_gpu: bool = False,
        headless: bool = False,
        user_data_dir: Optional[str] = None,
        browser_path: Optional[str] = None,
    ):
        self.use_gpu = use_gpu
        self.headless = headless
        self.user_data_dir = user_data_dir
        self.browser_path = browser_path
        self._slide_solver = None

    @property
    def slide(self):
        if self._slide_solver is None:
            from .captcha import SlideCaptchaSolver
            self._slide_solver = SlideCaptchaSolver(use_gpu=self.use_gpu)
        return self._slide_solver

    @staticmethod
    def scale_distance(canvas_distance, canvas_width, track_width):
        """
        把 canvas 缺口距离换算成实际拖动距离。

        GeeTest 背景 canvas 宽度与滑块可拖动轨道宽度通常不一致，
        需按比例换算。纯函数，便于单测。

        :param canvas_distance: 识别出的缺口距离（canvas 像素）
        :param canvas_width:    背景 canvas 实际渲染宽度
        :param track_width:     滑块可拖动的轨道宽度
        :return: 实际需要拖动的像素距离
        """
        if not canvas_distance or not canvas_width or not track_width or track_width <= 0:
            return canvas_distance
        return round(canvas_distance * track_width / canvas_width, 2)

    def solve_slide(
        self,
        page_url: str,
        max_retries: int = 3,
        verify_wait_ms: int = 1500,
    ) -> CaptchaResult:
        """
        在浏览器中自动完成 GeeTest v4 滑块验证。

        :param page_url:       目标页面 URL
        :param max_retries:    最大重试次数
        :param verify_wait_ms: 拖动后等待验证结果的时长（毫秒）
        :return: CaptchaResult，成功时 details 含 attempts / gap_distance / drag_distance
        """
        try:
            from DrissionPage import ChromiumPage, ChromiumOptions
        except ImportError:
            return CaptchaResult(
                success=False,
                captcha_type=CaptchaType.GEETEST_V4,
                error="DrissionPage 未安装 (pip install DrissionPage)",
            )

        page = None
        try:
            options = ChromiumOptions()
            if self.browser_path:
                options.set_browser_path(self.browser_path)
            if self.user_data_dir:
                options.set_user_data_path(self.user_data_dir)
            options.headless(self.headless)
            options.set_argument("--disable-blink-features=AutomationControlled")
            page = ChromiumPage(options)
            page.get(page_url)

            for attempt in range(max_retries):
                bg, slider, button = self._capture_slide(page)
                if bg is None or slider is None or button is None:
                    return CaptchaResult(
                        success=False,
                        captcha_type=CaptchaType.GEETEST_V4,
                        error="未定位到 GeeTest 滑块元素（DOM 可能已变化，请覆盖 SELECTORS）",
                    )

                result = self.slide.solve(bg, slider, algorithm="match")
                if not result.success:
                    return CaptchaResult(
                        success=False,
                        captcha_type=CaptchaType.GEETEST_V4,
                        error=f"缺口识别失败: {result.error}",
                    )

                gap = int(result.answer)
                track = result.details.get("track") or self.slide._generate_track(gap)

                canvas_width = self._canvas_width(page, self.SELECTORS["bg_canvas"])
                track_width = self._track_width(page, self.SELECTORS["slider_button"])
                drag_distance = self.scale_distance(gap, canvas_width, track_width)
                track = self._rescale_track(track, gap, drag_distance)

                logger.info(
                    f"GeeTest 滑块第 {attempt + 1} 次: 缺口 {gap}px, "
                    f"实际拖动 {drag_distance}px"
                )
                self._drag_slider(page, button, track)

                if self._passed(page, verify_wait_ms):
                    return CaptchaResult(
                        success=True,
                        captcha_type=CaptchaType.GEETEST_V4,
                        answer={"gap_distance": gap, "drag_distance": drag_distance},
                        details={"attempts": attempt + 1},
                    )

            return CaptchaResult(
                success=False,
                captcha_type=CaptchaType.GEETEST_V4,
                error=f"超过最大重试次数 {max_retries}",
            )

        except Exception as e:
            return CaptchaResult(
                success=False,
                captcha_type=CaptchaType.GEETEST_V4,
                error=f"GeeTest 浏览器求解异常: {e}",
            )
        finally:
            if page is not None:
                try:
                    page.quit()
                except Exception:
                    pass

    def _capture_slide(self, page):
        """截取背景图与滑块图，返回 (bg_bytes, slider_bytes, button_ele)"""
        bg = self._canvas_bytes(page, self.SELECTORS["bg_canvas"])
        slider = self._canvas_bytes(page, self.SELECTORS["slice_canvas"])
        button = page.ele(self.SELECTORS["slider_button"], timeout=3)
        return bg, slider, button

    def _canvas_bytes(self, page, selector):
        """从 canvas 元素提取 PNG bytes（通过 toDataURL）"""
        js = (
            "(() => {"
            "  const el = document.querySelector(%s);"
            "  return el && el.toDataURL ? el.toDataURL('image/png') : '';"
            "})()"
        ) % json.dumps(selector.split("css:", 1)[-1].split(",", 1)[0].strip())
        data = page.run_js(js, timeout=3)
        if not data or "," not in data:
            return None
        return base64.b64decode(data.split(",", 1)[1])

    def _canvas_width(self, page, selector):
        js = (
            "(() => { const el = document.querySelector(%s);"
            " return el ? el.width : 0; })()"
        ) % json.dumps(selector.split("css:", 1)[-1].split(",", 1)[0].strip())
        return int(page.run_js(js, timeout=3) or 0)

    def _track_width(self, page, selector):
        js = (
            "(() => { const el = document.querySelector(%s);"
            " const p = el && el.parentElement;"
            " return p ? p.clientWidth : 0; })()"
        ) % json.dumps(selector.split("css:", 1)[-1].split(",", 1)[0].strip())
        return int(page.run_js(js, timeout=3) or 0)

    @staticmethod
    def _rescale_track(track, from_distance, to_distance):
        """把轨迹按比例缩放到实际拖动距离（保持总位移 ≈ to_distance）"""
        if not track or from_distance <= 0 or to_distance == from_distance:
            return track
        ratio = to_distance / from_distance
        scaled = []
        for step in track:
            scaled.append({
                "x": step["x"] * ratio,
                "y": step["y"],
                "time_ms": step.get("time_ms", 20),
            })
        return scaled

    def _drag_slider(self, page, button, track):
        """按轨迹分步拖动滑块（CDP 级鼠标事件，isTrusted=true）"""
        try:
            ac = page.actions
            ac.move_to(button)
            ac.hold()
            for step in track:
                ac.move(step["x"], step["y"], duration=max(0.01, step.get("time_ms", 20) / 1000))
            ac.release()
        except Exception:
            # 兜底：JS 派发鼠标事件序列（isTrusted=false，风控可能识别）
            self._drag_slider_js(page, button, track)

    def _drag_slider_js(self, page, button, track):
        js = (
            "(() => {"
            "  const el = arguments[0];"
            "  const r = el.getBoundingClientRect();"
            "  let x = r.x + r.width / 2, y = r.y + r.height / 2;"
            "  const fire = (t, cx, cy) => el.dispatchEvent(new PointerEvent(t, {"
            "    bubbles: true, cancelable: true, clientX: cx, clientY: cy, pointerType: 'mouse'}));"
            "  fire('pointerdown', x, y); fire('mousedown', x, y);"
            "  for (const s of %s) { x += s.x; y += s.y;"
            "    fire('pointermove', x, y); fire('mousemove', x, y);"
            "    const end = Date.now() + (s.time_ms || 20); while (Date.now() < end) {}"
            "  }"
            "  fire('pointerup', x, y); fire('mouseup', x, y); return true;"
            "})()"
        ) % json.dumps(track)
        page.run_js(js, timeout=10)

    def _passed(self, page, wait_ms: int) -> bool:
        """拖动后判断验证是否通过（面板消失或出现成功状态）"""
        import time as _time
        _time.sleep(max(0.3, wait_ms / 1000))
        js = (
            "(() => {"
            "  const panel = document.querySelector('.geetest_panel_box, .geetest_captcha,"
            "    .geetest_panel, .geetest_popup');"
            "  if (!panel) return true;"
            "  const cls = panel.className || '';"
            "  return /success|\\u6210\\u529f|\\u901a\\u8fc7/i.test(cls);"
            "})()"
        )
        return bool(page.run_js(js, timeout=3))

