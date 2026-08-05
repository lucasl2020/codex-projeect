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
            # result: {"target": [x, y, w, h]}
            target = result.get("target", [0, 0, 0, 0])
            target_x = target[0]
            target_y = target[1]
            target_w = target[2]
            target_h = target[3]

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
