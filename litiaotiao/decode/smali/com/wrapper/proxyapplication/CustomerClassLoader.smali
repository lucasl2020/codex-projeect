.class public Lcom/wrapper/proxyapplication/CustomerClassLoader;
.super Ldalvik/system/PathClassLoader;
.source "CustomerClassLoader.java"


# static fields
.field private static final VERBOSE_DEBUG:Z


# instance fields
.field private initialized:Z

.field private final libPath:Ljava/lang/String;

.field private final mDexOutputPath:Ljava/lang/String;

.field private mDexs:[Ldalvik/system/DexFile;

.field private mFiles:[Ljava/io/File;

.field private mLibPaths:[Ljava/lang/String;

.field private mPaths:[Ljava/lang/String;

.field private mZips:[Ljava/util/zip/ZipFile;

.field private final path:Ljava/lang/String;


# direct methods
.method public constructor <init>(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/ClassLoader;)V
    .locals 2
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/NoSuchFieldException;,
            Ljava/lang/IllegalAccessException;,
            Ljava/lang/IllegalArgumentException;,
            Ljava/lang/NullPointerException;,
            Ljava/io/IOException;
        }
    .end annotation

    .line 72
    invoke-virtual {p4}, Ljava/lang/ClassLoader;->getParent()Ljava/lang/ClassLoader;

    move-result-object v0

    const-string v1, ""

    invoke-direct {p0, v1, p3, v0}, Ldalvik/system/PathClassLoader;-><init>(Ljava/lang/String;Ljava/lang/String;Ljava/lang/ClassLoader;)V

    if-eqz p1, :cond_0

    if-eqz p2, :cond_0

    .line 76
    iput-object p1, p0, Lcom/wrapper/proxyapplication/CustomerClassLoader;->path:Ljava/lang/String;

    .line 77
    iput-object p3, p0, Lcom/wrapper/proxyapplication/CustomerClassLoader;->libPath:Ljava/lang/String;

    .line 78
    iput-object p2, p0, Lcom/wrapper/proxyapplication/CustomerClassLoader;->mDexOutputPath:Ljava/lang/String;

    :try_start_0
    const-string p1, "parent"

    .line 80
    invoke-static {p4, p1}, Lcom/wrapper/proxyapplication/CustomerClassLoader;->findField(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object p1

    .line 81
    invoke-virtual {p1, p4, p0}, Ljava/lang/reflect/Field;->set(Ljava/lang/Object;Ljava/lang/Object;)V

    .line 82
    invoke-direct {p0}, Lcom/wrapper/proxyapplication/CustomerClassLoader;->ensureInit()V
    :try_end_0
    .catch Ljava/lang/NoSuchFieldException; {:try_start_0 .. :try_end_0} :catch_1
    .catch Ljava/io/IOException; {:try_start_0 .. :try_end_0} :catch_0

    return-void

    :catch_0
    move-exception p1

    .line 87
    throw p1

    :catch_1
    move-exception p1

    .line 84
    throw p1

    .line 74
    :cond_0
    new-instance p1, Ljava/lang/NullPointerException;

    invoke-direct {p1}, Ljava/lang/NullPointerException;-><init>()V

    throw p1
.end method

.method private native ShowLogs(Ljava/lang/String;I)I
.end method

.method private declared-synchronized ensureInit()V
    .locals 6
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;
        }
    .end annotation

    monitor-enter p0

    .line 93
    :try_start_0
    iget-boolean v0, p0, Lcom/wrapper/proxyapplication/CustomerClassLoader;->initialized:Z
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    if-eqz v0, :cond_0

    .line 94
    monitor-exit p0

    return-void

    :cond_0
    const/4 v0, 0x1

    .line 97
    :try_start_1
    iput-boolean v0, p0, Lcom/wrapper/proxyapplication/CustomerClassLoader;->initialized:Z

    .line 99
    iget-object v0, p0, Lcom/wrapper/proxyapplication/CustomerClassLoader;->path:Ljava/lang/String;

    const-string v1, ":"

    invoke-virtual {v0, v1}, Ljava/lang/String;->split(Ljava/lang/String;)[Ljava/lang/String;

    move-result-object v0

    iput-object v0, p0, Lcom/wrapper/proxyapplication/CustomerClassLoader;->mPaths:[Ljava/lang/String;

    .line 100
    iget-object v0, p0, Lcom/wrapper/proxyapplication/CustomerClassLoader;->mPaths:[Ljava/lang/String;

    array-length v0, v0

    .line 103
    new-array v1, v0, [Ljava/io/File;

    iput-object v1, p0, Lcom/wrapper/proxyapplication/CustomerClassLoader;->mFiles:[Ljava/io/File;

    .line 104
    new-array v1, v0, [Ljava/util/zip/ZipFile;

    iput-object v1, p0, Lcom/wrapper/proxyapplication/CustomerClassLoader;->mZips:[Ljava/util/zip/ZipFile;

    .line 105
    new-array v1, v0, [Ldalvik/system/DexFile;

    iput-object v1, p0, Lcom/wrapper/proxyapplication/CustomerClassLoader;->mDexs:[Ldalvik/system/DexFile;

    const/4 v1, 0x0

    const/4 v2, 0x0

    :goto_0
    if-ge v2, v0, :cond_2

    .line 110
    new-instance v3, Ljava/io/File;

    iget-object v4, p0, Lcom/wrapper/proxyapplication/CustomerClassLoader;->mPaths:[Ljava/lang/String;

    aget-object v4, v4, v2

    invoke-direct {v3, v4}, Ljava/io/File;-><init>(Ljava/lang/String;)V

    .line 111
    iget-object v4, p0, Lcom/wrapper/proxyapplication/CustomerClassLoader;->mFiles:[Ljava/io/File;

    aput-object v3, v4, v2

    .line 113
    invoke-virtual {v3}, Ljava/io/File;->isFile()Z

    move-result v4
    :try_end_1
    .catchall {:try_start_1 .. :try_end_1} :catchall_0

    if-eqz v4, :cond_1

    .line 115
    :try_start_2
    iget-object v4, p0, Lcom/wrapper/proxyapplication/CustomerClassLoader;->mZips:[Ljava/util/zip/ZipFile;

    new-instance v5, Ljava/util/zip/ZipFile;

    invoke-direct {v5, v3}, Ljava/util/zip/ZipFile;-><init>(Ljava/io/File;)V

    aput-object v5, v4, v2
    :try_end_2
    .catch Ljava/io/IOException; {:try_start_2 .. :try_end_2} :catch_0
    .catchall {:try_start_2 .. :try_end_2} :catchall_0

    .line 124
    :catch_0
    :try_start_3
    iget-object v3, p0, Lcom/wrapper/proxyapplication/CustomerClassLoader;->mDexOutputPath:Ljava/lang/String;

    if-eqz v3, :cond_1

    .line 125
    iget-object v3, p0, Lcom/wrapper/proxyapplication/CustomerClassLoader;->mPaths:[Ljava/lang/String;

    aget-object v3, v3, v2

    iget-object v4, p0, Lcom/wrapper/proxyapplication/CustomerClassLoader;->mDexOutputPath:Ljava/lang/String;

    invoke-static {v3, v4}, Lcom/wrapper/proxyapplication/CustomerClassLoader;->generateOutputName(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    move-result-object v3

    .line 126
    iget-object v4, p0, Lcom/wrapper/proxyapplication/CustomerClassLoader;->mDexs:[Ldalvik/system/DexFile;

    iget-object v5, p0, Lcom/wrapper/proxyapplication/CustomerClassLoader;->mPaths:[Ljava/lang/String;

    aget-object v5, v5, v2

    invoke-static {v5, v3, v1}, Ldalvik/system/DexFile;->loadDex(Ljava/lang/String;Ljava/lang/String;I)Ldalvik/system/DexFile;

    move-result-object v3

    aput-object v3, v4, v2
    :try_end_3
    .catch Ljava/io/IOException; {:try_start_3 .. :try_end_3} :catch_2
    .catch Ljava/lang/RuntimeException; {:try_start_3 .. :try_end_3} :catch_1
    .catchall {:try_start_3 .. :try_end_3} :catchall_0

    goto :goto_1

    .line 133
    :catch_1
    :try_start_4
    new-instance v0, Ljava/io/IOException;

    const-string v1, "load dex fail"

    invoke-direct {v0, v1}, Ljava/io/IOException;-><init>(Ljava/lang/String;)V

    throw v0

    .line 130
    :catch_2
    new-instance v0, Ljava/io/IOException;

    const-string v1, "load dex fail"

    invoke-direct {v0, v1}, Ljava/io/IOException;-><init>(Ljava/lang/String;)V

    throw v0

    :cond_1
    :goto_1
    add-int/lit8 v2, v2, 0x1

    goto :goto_0

    :cond_2
    const-string v0, "java.library.path"

    const-string v2, "."

    .line 142
    invoke-static {v0, v2}, Ljava/lang/System;->getProperty(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    move-result-object v0

    const-string v2, "path.separator"

    const-string v3, ":"

    .line 143
    invoke-static {v2, v3}, Ljava/lang/System;->getProperty(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    move-result-object v2

    const-string v3, "file.separator"

    const-string v4, "/"

    .line 144
    invoke-static {v3, v4}, Ljava/lang/System;->getProperty(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    move-result-object v3

    .line 146
    iget-object v4, p0, Lcom/wrapper/proxyapplication/CustomerClassLoader;->libPath:Ljava/lang/String;

    if-eqz v4, :cond_4

    .line 147
    invoke-virtual {v0}, Ljava/lang/String;->length()I

    move-result v4

    if-lez v4, :cond_3

    .line 149
    new-instance v4, Ljava/lang/StringBuilder;

    invoke-direct {v4}, Ljava/lang/StringBuilder;-><init>()V

    iget-object v5, p0, Lcom/wrapper/proxyapplication/CustomerClassLoader;->libPath:Ljava/lang/String;

    invoke-virtual {v4, v5}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v4, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v4, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v4}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v0

    goto :goto_2

    .line 152
    :cond_3
    iget-object v0, p0, Lcom/wrapper/proxyapplication/CustomerClassLoader;->libPath:Ljava/lang/String;

    .line 156
    :cond_4
    :goto_2
    invoke-virtual {v0, v2}, Ljava/lang/String;->split(Ljava/lang/String;)[Ljava/lang/String;

    move-result-object v0

    iput-object v0, p0, Lcom/wrapper/proxyapplication/CustomerClassLoader;->mLibPaths:[Ljava/lang/String;

    .line 157
    iget-object v0, p0, Lcom/wrapper/proxyapplication/CustomerClassLoader;->mLibPaths:[Ljava/lang/String;

    array-length v0, v0

    :goto_3
    if-ge v1, v0, :cond_6

    .line 162
    iget-object v2, p0, Lcom/wrapper/proxyapplication/CustomerClassLoader;->mLibPaths:[Ljava/lang/String;

    aget-object v2, v2, v1

    invoke-virtual {v2, v3}, Ljava/lang/String;->endsWith(Ljava/lang/String;)Z

    move-result v2

    if-nez v2, :cond_5

    .line 163
    new-instance v2, Ljava/lang/StringBuilder;

    invoke-direct {v2}, Ljava/lang/StringBuilder;-><init>()V

    iget-object v4, p0, Lcom/wrapper/proxyapplication/CustomerClassLoader;->mLibPaths:[Ljava/lang/String;

    aget-object v5, v4, v1

    invoke-virtual {v2, v5}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v2, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v2}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v2

    aput-object v2, v4, v1
    :try_end_4
    .catchall {:try_start_4 .. :try_end_4} :catchall_0

    :cond_5
    add-int/lit8 v1, v1, 0x1

    goto :goto_3

    .line 167
    :cond_6
    monitor-exit p0

    return-void

    :catchall_0
    move-exception v0

    monitor-exit p0

    goto :goto_5

    :goto_4
    throw v0

    :goto_5
    goto :goto_4
.end method

.method private static findField(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;
    .locals 3
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/NoSuchFieldException;
        }
    .end annotation

    .line 493
    invoke-virtual {p0}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v0

    :goto_0
    if-eqz v0, :cond_1

    .line 495
    :try_start_0
    invoke-virtual {v0, p1}, Ljava/lang/Class;->getDeclaredField(Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v1

    .line 497
    invoke-virtual {v1}, Ljava/lang/reflect/Field;->isAccessible()Z

    move-result v2

    if-nez v2, :cond_0

    const/4 v2, 0x1

    .line 498
    invoke-virtual {v1, v2}, Ljava/lang/reflect/Field;->setAccessible(Z)V
    :try_end_0
    .catch Ljava/lang/NoSuchFieldException; {:try_start_0 .. :try_end_0} :catch_0

    :cond_0
    return-object v1

    .line 493
    :catch_0
    invoke-virtual {v0}, Ljava/lang/Class;->getSuperclass()Ljava/lang/Class;

    move-result-object v0

    goto :goto_0

    .line 507
    :cond_1
    new-instance v0, Ljava/lang/NoSuchFieldException;

    new-instance v1, Ljava/lang/StringBuilder;

    invoke-direct {v1}, Ljava/lang/StringBuilder;-><init>()V

    const-string v2, "Field "

    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v1, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string p1, " not found in "

    invoke-virtual {v1, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {p0}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object p0

    invoke-virtual {v1, p0}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;

    invoke-virtual {v1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p0

    invoke-direct {v0, p0}, Ljava/lang/NoSuchFieldException;-><init>(Ljava/lang/String;)V

    goto :goto_2

    :goto_1
    throw v0

    :goto_2
    goto :goto_1
.end method

.method private static generateOutputName(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;
    .locals 2

    .line 174
    new-instance v0, Ljava/lang/StringBuilder;

    const/16 v1, 0x50

    invoke-direct {v0, v1}, Ljava/lang/StringBuilder;-><init>(I)V

    .line 177
    invoke-virtual {v0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string v1, "/"

    .line 178
    invoke-virtual {p1, v1}, Ljava/lang/String;->endsWith(Ljava/lang/String;)Z

    move-result p1

    if-nez p1, :cond_0

    .line 179
    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 183
    :cond_0
    invoke-virtual {p0, v1}, Ljava/lang/String;->lastIndexOf(Ljava/lang/String;)I

    move-result p1

    if-gez p1, :cond_1

    goto :goto_0

    :cond_1
    add-int/lit8 p1, p1, 0x1

    .line 187
    invoke-virtual {p0, p1}, Ljava/lang/String;->substring(I)Ljava/lang/String;

    move-result-object p0

    :goto_0
    const-string p1, "."

    .line 197
    invoke-virtual {p0, p1}, Ljava/lang/String;->lastIndexOf(Ljava/lang/String;)I

    move-result p1

    if-gez p1, :cond_2

    .line 199
    invoke-virtual {v0, p0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    goto :goto_1

    :cond_2
    const/4 v1, 0x0

    .line 201
    invoke-virtual {v0, p0, v1, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/CharSequence;II)Ljava/lang/StringBuilder;

    :goto_1
    const-string p0, ".dex"

    .line 202
    invoke-virtual {v0, p0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 206
    invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p0

    return-object p0
.end method

.method private isInArchive(Ljava/util/zip/ZipFile;Ljava/lang/String;)Z
    .locals 0

    .line 412
    invoke-virtual {p1, p2}, Ljava/util/zip/ZipFile;->getEntry(Ljava/lang/String;)Ljava/util/zip/ZipEntry;

    move-result-object p1

    if-eqz p1, :cond_0

    const/4 p1, 0x1

    goto :goto_0

    :cond_0
    const/4 p1, 0x0

    :goto_0
    return p1
.end method

.method private loadFromArchive(Ljava/util/zip/ZipFile;Ljava/lang/String;)[B
    .locals 4

    .line 378
    invoke-virtual {p1, p2}, Ljava/util/zip/ZipFile;->getEntry(Ljava/lang/String;)Ljava/util/zip/ZipEntry;

    move-result-object p2

    const/4 v0, 0x0

    if-nez p2, :cond_0

    return-object v0

    .line 392
    :cond_0
    :try_start_0
    invoke-virtual {p1, p2}, Ljava/util/zip/ZipFile;->getInputStream(Ljava/util/zip/ZipEntry;)Ljava/io/InputStream;

    move-result-object p1

    .line 393
    new-instance v1, Ljava/io/ByteArrayOutputStream;

    invoke-virtual {p2}, Ljava/util/zip/ZipEntry;->getSize()J

    move-result-wide v2

    long-to-int p2, v2

    invoke-direct {v1, p2}, Ljava/io/ByteArrayOutputStream;-><init>(I)V

    const/16 p2, 0x1000

    new-array p2, p2, [B

    .line 395
    :goto_0
    invoke-virtual {p1, p2}, Ljava/io/InputStream;->read([B)I

    move-result v2

    if-lez v2, :cond_1

    const/4 v3, 0x0

    .line 396
    invoke-virtual {v1, p2, v3, v2}, Ljava/io/ByteArrayOutputStream;->write([BII)V

    goto :goto_0

    .line 398
    :cond_1
    invoke-virtual {p1}, Ljava/io/InputStream;->close()V
    :try_end_0
    .catch Ljava/io/IOException; {:try_start_0 .. :try_end_0} :catch_0

    .line 405
    invoke-virtual {v1}, Ljava/io/ByteArrayOutputStream;->toByteArray()[B

    move-result-object p1

    return-object p1

    :catch_0
    return-object v0
.end method

.method private loadFromDirectory(Ljava/lang/String;)[B
    .locals 4

    const/4 v0, 0x0

    .line 350
    :try_start_0
    new-instance v1, Ljava/io/RandomAccessFile;

    const-string v2, "r"

    invoke-direct {v1, p1, v2}, Ljava/io/RandomAccessFile;-><init>(Ljava/lang/String;Ljava/lang/String;)V
    :try_end_0
    .catch Ljava/io/FileNotFoundException; {:try_start_0 .. :try_end_0} :catch_1

    .line 357
    :try_start_1
    invoke-virtual {v1}, Ljava/io/RandomAccessFile;->length()J

    move-result-wide v2

    long-to-int p1, v2

    new-array p1, p1, [B

    .line 358
    invoke-virtual {v1, p1}, Ljava/io/RandomAccessFile;->read([B)I

    .line 359
    invoke-virtual {v1}, Ljava/io/RandomAccessFile;->close()V
    :try_end_1
    .catch Ljava/io/IOException; {:try_start_1 .. :try_end_1} :catch_0

    goto :goto_0

    :catch_0
    move-object p1, v0

    :goto_0
    return-object p1

    :catch_1
    return-object v0
.end method


# virtual methods
.method protected findClass(Ljava/lang/String;)Ljava/lang/Class;
    .locals 7
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "(",
            "Ljava/lang/String;",
            ")",
            "Ljava/lang/Class<",
            "*>;"
        }
    .end annotation

    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/ClassNotFoundException;
        }
    .end annotation

    .line 221
    :try_start_0
    invoke-direct {p0}, Lcom/wrapper/proxyapplication/CustomerClassLoader;->ensureInit()V
    :try_end_0
    .catch Ljava/io/IOException; {:try_start_0 .. :try_end_0} :catch_0

    goto :goto_0

    :catch_0
    move-exception v0

    .line 224
    invoke-virtual {v0}, Ljava/io/IOException;->printStackTrace()V

    .line 230
    :goto_0
    iget-object v0, p0, Lcom/wrapper/proxyapplication/CustomerClassLoader;->mPaths:[Ljava/lang/String;

    array-length v0, v0

    const/4 v1, 0x0

    :goto_1
    if-ge v1, v0, :cond_4

    .line 234
    iget-object v2, p0, Lcom/wrapper/proxyapplication/CustomerClassLoader;->mDexs:[Ldalvik/system/DexFile;

    aget-object v2, v2, v1

    const/16 v3, 0x2f

    const/16 v4, 0x2e

    if-eqz v2, :cond_1

    .line 235
    invoke-direct {p0, p1, v1}, Lcom/wrapper/proxyapplication/CustomerClassLoader;->ShowLogs(Ljava/lang/String;I)I

    .line 236
    invoke-virtual {p1, v4, v3}, Ljava/lang/String;->replace(CC)Ljava/lang/String;

    move-result-object v2

    .line 237
    iget-object v3, p0, Lcom/wrapper/proxyapplication/CustomerClassLoader;->mDexs:[Ldalvik/system/DexFile;

    aget-object v3, v3, v1

    invoke-virtual {v3, v2, p0}, Ldalvik/system/DexFile;->loadClass(Ljava/lang/String;Ljava/lang/ClassLoader;)Ljava/lang/Class;

    move-result-object v2

    if-eqz v2, :cond_0

    return-object v2

    .line 244
    :cond_0
    :try_start_1
    invoke-super {p0, p1}, Ldalvik/system/PathClassLoader;->findClass(Ljava/lang/String;)Ljava/lang/Class;

    move-result-object v2
    :try_end_1
    .catch Ljava/lang/ClassNotFoundException; {:try_start_1 .. :try_end_1} :catch_1

    if-eqz v2, :cond_3

    return-object v2

    .line 255
    :cond_1
    iget-object v2, p0, Lcom/wrapper/proxyapplication/CustomerClassLoader;->mZips:[Ljava/util/zip/ZipFile;

    aget-object v2, v2, v1

    const-string v5, ".class"

    if-eqz v2, :cond_2

    .line 256
    new-instance v2, Ljava/lang/StringBuilder;

    invoke-direct {v2}, Ljava/lang/StringBuilder;-><init>()V

    invoke-virtual {p1, v4, v3}, Ljava/lang/String;->replace(CC)Ljava/lang/String;

    move-result-object v3

    invoke-virtual {v2, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v2, v5}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v2}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v2

    .line 257
    iget-object v3, p0, Lcom/wrapper/proxyapplication/CustomerClassLoader;->mZips:[Ljava/util/zip/ZipFile;

    aget-object v3, v3, v1

    invoke-direct {p0, v3, v2}, Lcom/wrapper/proxyapplication/CustomerClassLoader;->loadFromArchive(Ljava/util/zip/ZipFile;Ljava/lang/String;)[B

    goto :goto_2

    .line 259
    :cond_2
    iget-object v2, p0, Lcom/wrapper/proxyapplication/CustomerClassLoader;->mFiles:[Ljava/io/File;

    aget-object v2, v2, v1

    .line 260
    invoke-virtual {v2}, Ljava/io/File;->isDirectory()Z

    move-result v2

    if-eqz v2, :cond_3

    .line 261
    new-instance v2, Ljava/lang/StringBuilder;

    invoke-direct {v2}, Ljava/lang/StringBuilder;-><init>()V

    iget-object v6, p0, Lcom/wrapper/proxyapplication/CustomerClassLoader;->mPaths:[Ljava/lang/String;

    aget-object v6, v6, v1

    invoke-virtual {v2, v6}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string v6, "/"

    invoke-virtual {v2, v6}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {p1, v4, v3}, Ljava/lang/String;->replace(CC)Ljava/lang/String;

    move-result-object v3

    invoke-virtual {v2, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v2, v5}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v2}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v2

    .line 262
    invoke-direct {p0, v2}, Lcom/wrapper/proxyapplication/CustomerClassLoader;->loadFromDirectory(Ljava/lang/String;)[B

    :catch_1
    :cond_3
    :goto_2
    add-int/lit8 v1, v1, 0x1

    goto :goto_1

    .line 287
    :cond_4
    new-instance v0, Ljava/lang/ClassNotFoundException;

    new-instance v1, Ljava/lang/StringBuilder;

    invoke-direct {v1}, Ljava/lang/StringBuilder;-><init>()V

    invoke-virtual {v1, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string p1, " in loader "

    invoke-virtual {v1, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v1, p0}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;

    invoke-virtual {v1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p1

    invoke-direct {v0, p1}, Ljava/lang/ClassNotFoundException;-><init>(Ljava/lang/String;)V

    goto :goto_4

    :goto_3
    throw v0

    :goto_4
    goto :goto_3
.end method

.method public findLibrary(Ljava/lang/String;)Ljava/lang/String;
    .locals 4

    .line 425
    :try_start_0
    invoke-direct {p0}, Lcom/wrapper/proxyapplication/CustomerClassLoader;->ensureInit()V
    :try_end_0
    .catch Ljava/io/IOException; {:try_start_0 .. :try_end_0} :catch_0

    goto :goto_0

    :catch_0
    move-exception v0

    .line 428
    invoke-virtual {v0}, Ljava/io/IOException;->printStackTrace()V

    .line 431
    :goto_0
    invoke-static {p1}, Ljava/lang/System;->mapLibraryName(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v0

    const/4 v1, 0x0

    .line 432
    :goto_1
    iget-object v2, p0, Lcom/wrapper/proxyapplication/CustomerClassLoader;->mLibPaths:[Ljava/lang/String;

    array-length v2, v2

    if-ge v1, v2, :cond_2

    .line 433
    new-instance v2, Ljava/lang/StringBuilder;

    invoke-direct {v2}, Ljava/lang/StringBuilder;-><init>()V

    iget-object v3, p0, Lcom/wrapper/proxyapplication/CustomerClassLoader;->mLibPaths:[Ljava/lang/String;

    aget-object v3, v3, v1

    invoke-virtual {v2, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v2, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v2}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v2

    .line 434
    new-instance v3, Ljava/io/File;

    invoke-direct {v3, v2}, Ljava/io/File;-><init>(Ljava/lang/String;)V

    .line 436
    invoke-virtual {v3}, Ljava/io/File;->exists()Z

    move-result v3

    if-eqz v3, :cond_0

    return-object v2

    .line 439
    :cond_0
    invoke-super {p0, p1}, Ldalvik/system/PathClassLoader;->findLibrary(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v2

    if-eqz v2, :cond_1

    return-object v2

    :cond_1
    add-int/lit8 v1, v1, 0x1

    goto :goto_1

    :cond_2
    const/4 p1, 0x0

    return-object p1
.end method

.method protected findResource(Ljava/lang/String;)Ljava/net/URL;
    .locals 6

    .line 302
    invoke-super {p0, p1}, Ldalvik/system/PathClassLoader;->findResource(Ljava/lang/String;)Ljava/net/URL;

    move-result-object v0

    if-eqz v0, :cond_0

    return-object v0

    .line 308
    :cond_0
    iget-object v0, p0, Lcom/wrapper/proxyapplication/CustomerClassLoader;->mPaths:[Ljava/lang/String;

    array-length v0, v0

    const/4 v1, 0x0

    :goto_0
    if-ge v1, v0, :cond_2

    .line 311
    iget-object v2, p0, Lcom/wrapper/proxyapplication/CustomerClassLoader;->mFiles:[Ljava/io/File;

    aget-object v2, v2, v1

    .line 312
    iget-object v3, p0, Lcom/wrapper/proxyapplication/CustomerClassLoader;->mZips:[Ljava/util/zip/ZipFile;

    aget-object v3, v3, v1

    .line 313
    iget-object v4, p0, Lcom/wrapper/proxyapplication/CustomerClassLoader;->mPaths:[Ljava/lang/String;

    aget-object v4, v4, v1

    const-string v5, ".dex"

    invoke-virtual {v4, v5}, Ljava/lang/String;->endsWith(Ljava/lang/String;)Z

    move-result v4

    if-nez v4, :cond_1

    .line 314
    invoke-virtual {v3, p1}, Ljava/util/zip/ZipFile;->getEntry(Ljava/lang/String;)Ljava/util/zip/ZipEntry;

    move-result-object v3

    if-eqz v3, :cond_1

    .line 322
    :try_start_0
    new-instance v0, Ljava/net/URL;

    new-instance v1, Ljava/lang/StringBuilder;

    invoke-direct {v1}, Ljava/lang/StringBuilder;-><init>()V

    const-string v3, "jar:"

    invoke-virtual {v1, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v2}, Ljava/io/File;->toURL()Ljava/net/URL;

    move-result-object v2

    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;

    const-string v2, "!/"

    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v1, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p1

    invoke-direct {v0, p1}, Ljava/net/URL;-><init>(Ljava/lang/String;)V
    :try_end_0
    .catch Ljava/net/MalformedURLException; {:try_start_0 .. :try_end_0} :catch_0

    return-object v0

    :catch_0
    move-exception p1

    .line 324
    new-instance v0, Ljava/lang/RuntimeException;

    invoke-direct {v0, p1}, Ljava/lang/RuntimeException;-><init>(Ljava/lang/Throwable;)V

    throw v0

    :cond_1
    add-int/lit8 v1, v1, 0x1

    goto :goto_0

    :cond_2
    const/4 p1, 0x0

    return-object p1
.end method

.method protected getPackage(Ljava/lang/String;)Ljava/lang/Package;
    .locals 10

    if-eqz p1, :cond_1

    const-string v0, ""

    .line 475
    invoke-virtual {v0, p1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    if-nez v0, :cond_1

    .line 476
    monitor-enter p0

    .line 477
    :try_start_0
    invoke-super {p0, p1}, Ldalvik/system/PathClassLoader;->getPackage(Ljava/lang/String;)Ljava/lang/Package;

    move-result-object v0

    if-nez v0, :cond_0

    const-string v3, "Unknown"

    const-string v4, "0.0"

    const-string v5, "Unknown"

    const-string v6, "Unknown"

    const-string v7, "0.0"

    const-string v8, "Unknown"

    const/4 v9, 0x0

    move-object v1, p0

    move-object v2, p1

    .line 480
    invoke-virtual/range {v1 .. v9}, Lcom/wrapper/proxyapplication/CustomerClassLoader;->definePackage(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/net/URL;)Ljava/lang/Package;

    move-result-object v0

    .line 483
    :cond_0
    monitor-exit p0

    return-object v0

    :catchall_0
    move-exception p1

    .line 484
    monitor-exit p0
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    throw p1

    :cond_1
    const/4 p1, 0x0

    return-object p1
.end method
