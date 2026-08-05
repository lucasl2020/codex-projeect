package main

// ============================================================
// Go 调用示例
// ============
// 任何 Go 项目都可通过 HTTP 调用 cf-captcha-solver 服务
//
// 运行: go run go_example.go
// 前提: 先启动 API 服务 → cf-captcha-server --port 8000
// ============================================================

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"strings"
)

const BaseURL = "http://localhost:8000"

// ---- 统一响应结构 ----
type APIResponse struct {
	Success bool                   `json:"success"`
	Data    map[string]interface{} `json:"data"`
	Error   string                 `json:"error"`
}

// ---- 通用 POST JSON ----
func postJSON(endpoint string, body interface{}) (*APIResponse, error) {
	jsonBody, _ := json.Marshal(body)
	resp, err := http.Post(BaseURL+endpoint, "application/json", bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result APIResponse
	json.NewDecoder(resp.Body).Decode(&result)
	return &result, nil
}

// ---- 1. 健康检查 ----
func healthCheck() {
	resp, _ := http.Get(BaseURL + "/api/health")
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	fmt.Println("[健康检查]", string(body))
}

// ---- 2. 检测验证码类型 ----
func detectCaptcha() {
	result, _ := postJSON("/api/captcha/detect", map[string]string{
		"html": `<div class="cf-turnstile" data-sitekey="xxx"></div>`,
	})
	fmt.Printf("[验证码检测] type=%v\n", result.Data["captcha_type"])
}

// ---- 3. 识别文字验证码（上传文件） ----
func solveFromFile(imagePath string) {
	file, err := os.Open(imagePath)
	if err != nil {
		fmt.Println("[文件识别] 打开文件失败:", err)
		return
	}
	defer file.Close()

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, _ := writer.CreateFormFile("image", "captcha.png")
	io.Copy(part, file)
	writer.WriteField("captcha_type", "text")
	writer.Close()

	resp, _ := http.Post(BaseURL+"/api/captcha/solve", writer.FormDataContentType(), body)
	defer resp.Body.Close()

	var result APIResponse
	json.NewDecoder(resp.Body).Decode(&result)
	if result.Success {
		fmt.Printf("[文件识别] answer=%v\n", result.Data["answer"])
	} else {
		fmt.Println("[文件识别] 失败:", result.Error)
	}
}

// ---- 4. 识别验证码（Base64 JSON） ----
func solveFromBase64(imagePath string) {
	imageBytes, _ := os.ReadFile(imagePath)
	imageBase64 := base64.StdEncoding.EncodeToString(imageBytes)

	result, _ := postJSON("/api/captcha/solve/json", map[string]string{
		"image_base64": imageBase64,
		"captcha_type": "text",
	})
	if result.Success {
		fmt.Printf("[Base64识别] answer=%v\n", result.Data["answer"])
	} else {
		fmt.Println("[Base64识别] 失败:", result.Error)
	}
}

// ---- 5. 绕过 Cloudflare ----
func bypassCloudflare(targetURL string) {
	result, _ := postJSON("/api/cloudflare/bypass", map[string]interface{}{
		"url":      targetURL,
		"headless": true,
		"timeout":  30,
	})
	if result.Success {
		strategy, _ := result.Data["strategy"].(string)
		fmt.Printf("[CF绕过成功] 策略=%s\n", strategy)
		// cookies := result.Data["cookies"].(map[string]interface{})
		// userAgent, _ := result.Data["user_agent"].(string)
		// 用 cookies + UA 继续请求...
	} else {
		fmt.Println("[CF绕过失败]", result.Error)
	}
}

// ---- 主流程 ----
func main() {
	fmt.Println(strings.Repeat("=", 50))
	fmt.Println("cf-captcha-solver Go 调用示例")
	fmt.Println(strings.Repeat("=", 50))

	healthCheck()
	detectCaptcha()

	// 如果有图片文件则测试
	if _, err := os.Stat("captcha.png"); err == nil {
		solveFromFile("captcha.png")
		solveFromBase64("captcha.png")
	} else {
		fmt.Println("\n[跳过] 未找到 captcha.png")
	}

	// bypassCloudflare("https://example.com")
}
