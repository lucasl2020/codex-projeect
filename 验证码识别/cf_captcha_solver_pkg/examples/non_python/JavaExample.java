import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Base64;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

/**
 * Java 调用示例
 * ============
 * 任何 Java 项目都可通过 HTTP 调用 cf-captcha-solver 服务
 *
 * 依赖: Gson (com.google.code.gson:gson)
 * 运行: javac -cp gson.jar JavaExample.java && java -cp .:gson.jar JavaExample
 * 前提: 先启动 API 服务 → cf-captcha-server --port 8000
 */
public class JavaExample {

    private static final String BASE_URL = "http://localhost:8000";
    private static final Gson gson = new Gson();

    // ---- 通用 HTTP POST JSON ----
    private static JsonObject postJSON(String endpoint, JsonObject body) throws Exception {
        URL url = new URL(BASE_URL + endpoint);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setDoOutput(true);
        conn.getOutputStream().write(gson.toJson(body).getBytes());

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()))) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) sb.append(line);
            return JsonParser.parseString(sb.toString()).getAsJsonObject();
        }
    }

    // ---- 1. 健康检查 ----
    private static void healthCheck() throws Exception {
        URL url = new URL(BASE_URL + "/api/health");
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()))) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) sb.append(line);
            System.out.println("[健康检查] " + sb);
        }
    }

    // ---- 2. 检测验证码类型 ----
    private static void detectCaptcha() throws Exception {
        JsonObject body = new JsonObject();
        body.addProperty("html", "<div class=\"cf-turnstile\" data-sitekey=\"xxx\"></div>");
        JsonObject result = postJSON("/api/captcha/detect", body);
        System.out.println("[验证码检测] type=" +
            result.getAsJsonObject("data").get("captcha_type").getAsString());
    }

    // ---- 3. 识别验证码（Base64 JSON） ----
    private static void solveFromBase64(String imagePath) throws Exception {
        byte[] imageBytes = Files.readAllBytes(Paths.get(imagePath));
        String imageBase64 = Base64.getEncoder().encodeToString(imageBytes);

        JsonObject body = new JsonObject();
        body.addProperty("image_base64", imageBase64);
        body.addProperty("captcha_type", "text");

        JsonObject result = postJSON("/api/captcha/solve/json", body);
        if (result.get("success").getAsBoolean()) {
            System.out.println("[Base64识别] answer=" +
                result.getAsJsonObject("data").get("answer").getAsString());
        } else {
            System.out.println("[Base64识别] 失败: " + result.get("error").getAsString());
        }
    }

    // ---- 4. 绕过 Cloudflare ----
    private static void bypassCloudflare(String targetUrl) throws Exception {
        JsonObject body = new JsonObject();
        body.addProperty("url", targetUrl);
        body.addProperty("headless", true);
        body.addProperty("timeout", 30);

        JsonObject result = postJSON("/api/cloudflare/bypass", body);
        if (result.get("success").getAsBoolean()) {
            JsonObject data = result.getAsJsonObject("data");
            System.out.println("[CF绕过成功] 策略=" + data.get("strategy").getAsString());
            System.out.println("  UA=" + data.get("user_agent").getAsString());
            // 用 cookies + UA 继续请求...
        } else {
            System.out.println("[CF绕过失败] " + result.get("error").getAsString());
        }
    }

    // ---- 主流程 ----
    public static void main(String[] args) throws Exception {
        System.out.println("=".repeat(50));
        System.out.println("cf-captcha-solver Java 调用示例");
        System.out.println("=".repeat(50));

        healthCheck();
        detectCaptcha();

        // 如果有图片文件则测试
        File captchaFile = new File("captcha.png");
        if (captchaFile.exists()) {
            solveFromBase64("captcha.png");
        } else {
            System.out.println("\n[跳过] 未找到 captcha.png");
        }

        // bypassCloudflare("https://example.com");
    }
}
