.class Lcom/wrapper/proxyapplication/AndroidNClassLoader;
.super Ldalvik/system/PathClassLoader;
.source "AndroidNClassLoader.java"


# static fields
.field private static final TAG:Ljava/lang/String; = "SecShell"

.field private static baseApkFullPath:Ljava/lang/String;

.field private static oldDexPathListHolder:Ljava/lang/Object;


# direct methods
.method static constructor <clinit>()V
    .locals 0

    return-void
.end method

.method private constructor <init>(Ljava/lang/String;Ljava/lang/ClassLoader;Landroid/app/Application;)V
    .locals 0

    .line 28
    invoke-direct {p0, p1, p2}, Ldalvik/system/PathClassLoader;-><init>(Ljava/lang/String;Ljava/lang/ClassLoader;)V

    .line 30
    :try_start_0
    invoke-virtual {p3}, Landroid/app/Application;->getPackageCodePath()Ljava/lang/String;

    move-result-object p1

    sput-object p1, Lcom/wrapper/proxyapplication/AndroidNClassLoader;->baseApkFullPath:Ljava/lang/String;
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    :catchall_0
    return-void
.end method

.method private static createAndroidNClassLoader(Ljava/lang/String;Ljava/lang/ClassLoader;Landroid/app/Application;)Ljava/lang/ClassLoader;
    .locals 2
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/Exception;
        }
    .end annotation

    .line 100
    :try_start_0
    new-instance v0, Lcom/wrapper/proxyapplication/AndroidNClassLoader;

    invoke-direct {v0, p0, p1, p2}, Lcom/wrapper/proxyapplication/AndroidNClassLoader;-><init>(Ljava/lang/String;Ljava/lang/ClassLoader;Landroid/app/Application;)V

    const-string p0, "pathList"

    .line 102
    invoke-static {p1, p0}, Lcom/wrapper/proxyapplication/ShareReflectUtil;->findField(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object p0

    .line 103
    invoke-virtual {p0, p1}, Ljava/lang/reflect/Field;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object p2

    const/4 v1, 0x0

    .line 105
    invoke-static {p2, v0, v1}, Lcom/wrapper/proxyapplication/AndroidNClassLoader;->recreateDexPathList(Ljava/lang/Object;Ljava/lang/ClassLoader;Z)Ljava/lang/Object;

    move-result-object v1

    .line 108
    invoke-virtual {p0, v0, v1}, Ljava/lang/reflect/Field;->set(Ljava/lang/Object;Ljava/lang/Object;)V

    const-string p0, "definingContext"

    .line 118
    invoke-static {p2, p0}, Lcom/wrapper/proxyapplication/ShareReflectUtil;->findField(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object p0

    invoke-virtual {p0, p2, v0}, Ljava/lang/reflect/Field;->set(Ljava/lang/Object;Ljava/lang/Object;)V

    .line 121
    sput-object p2, Lcom/wrapper/proxyapplication/AndroidNClassLoader;->oldDexPathListHolder:Ljava/lang/Object;
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    return-object v0

    :catchall_0
    return-object p1
.end method

.method public static inject(Ljava/lang/ClassLoader;Landroid/app/Application;)Ljava/lang/ClassLoader;
    .locals 1
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/Exception;
        }
    .end annotation

    :try_start_0
    const-string v0, ""

    .line 146
    invoke-static {v0, p0, p1}, Lcom/wrapper/proxyapplication/AndroidNClassLoader;->createAndroidNClassLoader(Ljava/lang/String;Ljava/lang/ClassLoader;Landroid/app/Application;)Ljava/lang/ClassLoader;

    move-result-object p0

    .line 147
    invoke-static {p1, p0}, Lcom/wrapper/proxyapplication/AndroidNClassLoader;->reflectPackageInfoClassloader(Landroid/app/Application;Ljava/lang/ClassLoader;)V
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    return-object p0

    :catchall_0
    const/4 p0, 0x0

    return-object p0
.end method

.method private static recreateDexPathList(Ljava/lang/Object;Ljava/lang/ClassLoader;Z)Ljava/lang/Object;
    .locals 16
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/Exception;
        }
    .end annotation

    move-object/from16 v0, p0

    const/4 v1, 0x4

    const/4 v2, 0x0

    :try_start_0
    new-array v3, v1, [Ljava/lang/Class;

    .line 40
    const-class v4, Ljava/lang/ClassLoader;

    const/4 v5, 0x0

    aput-object v4, v3, v5

    const-class v4, Ljava/lang/String;

    const/4 v6, 0x1

    aput-object v4, v3, v6

    const-class v4, Ljava/lang/String;

    const/4 v7, 0x2

    aput-object v4, v3, v7

    const-class v4, Ljava/io/File;

    const/4 v8, 0x3

    aput-object v4, v3, v8

    invoke-static {v0, v3}, Lcom/wrapper/proxyapplication/ShareReflectUtil;->findConstructor(Ljava/lang/Object;[Ljava/lang/Class;)Ljava/lang/reflect/Constructor;

    move-result-object v3

    if-eqz p2, :cond_0

    new-array v0, v1, [Ljava/lang/Object;

    aput-object p1, v0, v5

    const-string v1, ""

    aput-object v1, v0, v6

    aput-object v2, v0, v7

    aput-object v2, v0, v8

    .line 43
    invoke-virtual {v3, v0}, Ljava/lang/reflect/Constructor;->newInstance([Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v0

    return-object v0

    :cond_0
    const-string v4, "dexElements"

    .line 45
    invoke-static {v0, v4}, Lcom/wrapper/proxyapplication/ShareReflectUtil;->findField(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v4

    .line 46
    invoke-virtual {v4, v0}, Ljava/lang/reflect/Field;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v4

    check-cast v4, [Ljava/lang/Object;

    check-cast v4, [Ljava/lang/Object;

    const-string v9, "nativeLibraryDirectories"

    .line 47
    invoke-static {v0, v9}, Lcom/wrapper/proxyapplication/ShareReflectUtil;->findField(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v9

    .line 50
    invoke-virtual {v9, v0}, Ljava/lang/reflect/Field;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v0

    check-cast v0, Ljava/util/List;

    .line 52
    new-instance v9, Ljava/lang/StringBuilder;

    invoke-direct {v9}, Ljava/lang/StringBuilder;-><init>()V

    .line 53
    invoke-virtual {v4}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v10

    invoke-virtual {v10}, Ljava/lang/Class;->getComponentType()Ljava/lang/Class;

    move-result-object v10

    const-string v11, "dexFile"

    invoke-static {v10, v11}, Lcom/wrapper/proxyapplication/ShareReflectUtil;->findField(Ljava/lang/Class;Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v10

    .line 56
    array-length v11, v4

    const/4 v12, 0x0

    const/4 v13, 0x1

    :goto_0
    if-ge v12, v11, :cond_5

    aget-object v14, v4, v12

    .line 57
    invoke-virtual {v10, v14}, Ljava/lang/reflect/Field;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v14

    check-cast v14, Ldalvik/system/DexFile;

    if-eqz v14, :cond_4

    .line 58
    invoke-virtual {v14}, Ldalvik/system/DexFile;->getName()Ljava/lang/String;

    move-result-object v15

    if-nez v15, :cond_1

    goto :goto_2

    .line 61
    :cond_1
    invoke-virtual {v14}, Ldalvik/system/DexFile;->getName()Ljava/lang/String;

    move-result-object v15
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_1

    :try_start_1
    sget-object v2, Lcom/wrapper/proxyapplication/AndroidNClassLoader;->baseApkFullPath:Ljava/lang/String;

    invoke-virtual {v15, v2}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v2

    if-nez v2, :cond_2

    goto :goto_2

    :cond_2
    if-eqz v13, :cond_3

    const/4 v13, 0x0

    goto :goto_1

    .line 67
    :cond_3
    sget-object v2, Ljava/io/File;->pathSeparator:Ljava/lang/String;

    invoke-virtual {v9, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 69
    :goto_1
    invoke-virtual {v14}, Ldalvik/system/DexFile;->getName()Ljava/lang/String;

    move-result-object v2

    invoke-virtual {v9, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    :cond_4
    :goto_2
    add-int/lit8 v12, v12, 0x1

    const/4 v2, 0x0

    goto :goto_0

    .line 72
    :cond_5
    invoke-virtual {v9}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v2

    .line 74
    new-instance v4, Ljava/lang/StringBuilder;

    invoke-direct {v4}, Ljava/lang/StringBuilder;-><init>()V

    .line 76
    invoke-interface {v0}, Ljava/util/List;->iterator()Ljava/util/Iterator;

    move-result-object v0

    const/4 v9, 0x1

    :goto_3
    invoke-interface {v0}, Ljava/util/Iterator;->hasNext()Z

    move-result v10

    if-eqz v10, :cond_8

    invoke-interface {v0}, Ljava/util/Iterator;->next()Ljava/lang/Object;

    move-result-object v10

    check-cast v10, Ljava/io/File;

    if-nez v10, :cond_6

    goto :goto_3

    :cond_6
    if-eqz v9, :cond_7

    const/4 v9, 0x0

    goto :goto_4

    .line 83
    :cond_7
    sget-object v11, Ljava/io/File;->pathSeparator:Ljava/lang/String;

    invoke-virtual {v4, v11}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 85
    :goto_4
    invoke-virtual {v10}, Ljava/io/File;->getAbsolutePath()Ljava/lang/String;

    move-result-object v10

    invoke-virtual {v4, v10}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    goto :goto_3

    .line 88
    :cond_8
    invoke-virtual {v4}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v0

    new-array v1, v1, [Ljava/lang/Object;

    aput-object p1, v1, v5

    aput-object v2, v1, v6

    aput-object v0, v1, v7
    :try_end_1
    .catchall {:try_start_1 .. :try_end_1} :catchall_0

    const/4 v0, 0x0

    :try_start_2
    aput-object v0, v1, v8
    :try_end_2
    .catchall {:try_start_2 .. :try_end_2} :catchall_2

    .line 89
    :try_start_3
    invoke-virtual {v3, v1}, Ljava/lang/reflect/Constructor;->newInstance([Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v0
    :try_end_3
    .catchall {:try_start_3 .. :try_end_3} :catchall_0

    return-object v0

    :catchall_0
    const/4 v0, 0x0

    goto :goto_5

    :catchall_1
    move-object v0, v2

    :catchall_2
    :goto_5
    return-object v0
.end method

.method private static reflectPackageInfoClassloader(Landroid/app/Application;Ljava/lang/ClassLoader;)V
    .locals 1
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/Exception;
        }
    .end annotation

    :try_start_0
    const-string v0, "mBase"

    .line 133
    invoke-static {p0, v0}, Lcom/wrapper/proxyapplication/ShareReflectUtil;->findField(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v0

    invoke-virtual {v0, p0}, Ljava/lang/reflect/Field;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object p0

    check-cast p0, Landroid/content/Context;

    const-string v0, "mPackageInfo"

    .line 134
    invoke-static {p0, v0}, Lcom/wrapper/proxyapplication/ShareReflectUtil;->findField(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v0

    invoke-virtual {v0, p0}, Ljava/lang/reflect/Field;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object p0

    const-string v0, "mClassLoader"

    .line 135
    invoke-static {p0, v0}, Lcom/wrapper/proxyapplication/ShareReflectUtil;->findField(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v0

    invoke-virtual {v0, p0, p1}, Ljava/lang/reflect/Field;->set(Ljava/lang/Object;Ljava/lang/Object;)V
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    :catchall_0
    return-void
.end method
