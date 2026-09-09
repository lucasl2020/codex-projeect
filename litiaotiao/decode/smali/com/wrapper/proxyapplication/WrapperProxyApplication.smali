.class public abstract Lcom/wrapper/proxyapplication/WrapperProxyApplication;
.super Landroid/app/Application;
.source "WrapperProxyApplication.java"


# static fields
.field static baseContext:Landroid/content/Context; = null

.field static className:Ljava/lang/String; = "hello.litiaotiao.app.LttApp"

.field static mLoader:Ljava/lang/ClassLoader; = null

.field static shellApp:Landroid/app/Application; = null

.field static tinkerApp:Ljava/lang/String; = "tinker not support"


# direct methods
.method static constructor <clinit>()V
    .locals 0

    return-void
.end method

.method public constructor <init>()V
    .locals 0

    .line 18
    invoke-direct {p0}, Landroid/app/Application;-><init>()V

    return-void
.end method

.method private declared-synchronized Fixappname()Z
    .locals 2

    monitor-enter p0

    .line 41
    :try_start_0
    sget-object v0, Lcom/wrapper/proxyapplication/WrapperProxyApplication;->className:Ljava/lang/String;

    const-string v1, "."

    invoke-virtual {v0, v1}, Ljava/lang/String;->startsWith(Ljava/lang/String;)Z

    move-result v0

    if-eqz v0, :cond_0

    .line 42
    new-instance v0, Ljava/lang/StringBuilder;

    invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V

    invoke-super {p0}, Landroid/app/Application;->getPackageName()Ljava/lang/String;

    move-result-object v1

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    sget-object v1, Lcom/wrapper/proxyapplication/WrapperProxyApplication;->className:Ljava/lang/String;

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v0

    sput-object v0, Lcom/wrapper/proxyapplication/WrapperProxyApplication;->className:Ljava/lang/String;

    goto :goto_0

    .line 44
    :cond_0
    sget-object v0, Lcom/wrapper/proxyapplication/WrapperProxyApplication;->className:Ljava/lang/String;

    const-string v1, "."

    invoke-virtual {v0, v1}, Ljava/lang/String;->indexOf(Ljava/lang/String;)I

    move-result v0

    if-gez v0, :cond_1

    .line 45
    new-instance v0, Ljava/lang/StringBuilder;

    invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V

    invoke-super {p0}, Landroid/app/Application;->getPackageName()Ljava/lang/String;

    move-result-object v1

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string v1, "."

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    sget-object v1, Lcom/wrapper/proxyapplication/WrapperProxyApplication;->className:Ljava/lang/String;

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v0

    sput-object v0, Lcom/wrapper/proxyapplication/WrapperProxyApplication;->className:Ljava/lang/String;
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    :cond_1
    :goto_0
    const/4 v0, 0x1

    .line 48
    monitor-exit p0

    return v0

    :catchall_0
    move-exception v0

    monitor-exit p0

    throw v0
.end method

.method public static fixAndroid(Landroid/content/Context;Landroid/app/Application;)V
    .locals 2

    .line 417
    sget v0, Landroid/os/Build$VERSION;->SDK_INT:I

    const/16 v1, 0x1c

    if-ne v0, v1, :cond_0

    .line 419
    :try_start_0
    invoke-virtual {p0}, Landroid/content/Context;->getClassLoader()Ljava/lang/ClassLoader;

    move-result-object p0

    .line 422
    invoke-static {p0, p1}, Lcom/wrapper/proxyapplication/AndroidNClassLoader;->inject(Ljava/lang/ClassLoader;Landroid/app/Application;)Ljava/lang/ClassLoader;

    move-result-object p0

    sput-object p0, Lcom/wrapper/proxyapplication/WrapperProxyApplication;->mLoader:Ljava/lang/ClassLoader;
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    goto :goto_0

    :catchall_0
    move-exception p0

    .line 426
    invoke-virtual {p0}, Ljava/lang/Throwable;->printStackTrace()V

    :cond_0
    :goto_0
    return-void
.end method

.method private static getVersionCode(Landroid/content/Context;)Ljava/lang/String;
    .locals 2

    .line 433
    :try_start_0
    invoke-virtual {p0}, Landroid/content/Context;->getPackageManager()Landroid/content/pm/PackageManager;

    move-result-object v0

    invoke-virtual {p0}, Landroid/content/Context;->getPackageName()Ljava/lang/String;

    move-result-object p0

    const/4 v1, 0x0

    invoke-virtual {v0, p0, v1}, Landroid/content/pm/PackageManager;->getPackageInfo(Ljava/lang/String;I)Landroid/content/pm/PackageInfo;

    move-result-object p0

    iget-object p0, p0, Landroid/content/pm/PackageInfo;->versionName:Ljava/lang/String;
    :try_end_0
    .catch Landroid/content/pm/PackageManager$NameNotFoundException; {:try_start_0 .. :try_end_0} :catch_0

    return-object p0

    :catch_0
    move-exception p0

    .line 436
    invoke-virtual {p0}, Landroid/content/pm/PackageManager$NameNotFoundException;->printStackTrace()V

    const-string p0, "0"

    return-object p0
.end method

.method static getWrapperProxyAppBaseContext()Landroid/content/Context;
    .locals 1

    .line 35
    sget-object v0, Lcom/wrapper/proxyapplication/WrapperProxyApplication;->baseContext:Landroid/content/Context;

    return-object v0
.end method


# virtual methods
.method native Ooo0ooO0oO()V
.end method

.method protected attachBaseContext(Landroid/content/Context;)V
    .locals 1

    .line 443
    invoke-super {p0, p1}, Landroid/app/Application;->attachBaseContext(Landroid/content/Context;)V

    .line 444
    invoke-virtual {p0}, Lcom/wrapper/proxyapplication/WrapperProxyApplication;->getBaseContext()Landroid/content/Context;

    move-result-object v0

    sput-object v0, Lcom/wrapper/proxyapplication/WrapperProxyApplication;->baseContext:Landroid/content/Context;

    .line 445
    sget-object v0, Lcom/wrapper/proxyapplication/WrapperProxyApplication;->shellApp:Landroid/app/Application;

    if-nez v0, :cond_0

    .line 446
    sput-object p0, Lcom/wrapper/proxyapplication/WrapperProxyApplication;->shellApp:Landroid/app/Application;

    .line 458
    :cond_0
    invoke-direct {p0}, Lcom/wrapper/proxyapplication/WrapperProxyApplication;->Fixappname()Z

    .line 459
    invoke-virtual {p0, p1}, Lcom/wrapper/proxyapplication/WrapperProxyApplication;->initProxyApplication(Landroid/content/Context;)V

    return-void
.end method

.method protected abstract initProxyApplication(Landroid/content/Context;)V
.end method

.method public onCreate()V
    .locals 0

    .line 465
    invoke-super {p0}, Landroid/app/Application;->onCreate()V

    .line 466
    invoke-virtual {p0}, Lcom/wrapper/proxyapplication/WrapperProxyApplication;->Ooo0ooO0oO()V

    return-void
.end method
