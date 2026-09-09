.class final Lcom/wrapper/proxyapplication/MultiDexForTinkerForMemoryDex$V26;
.super Ljava/lang/Object;
.source "MultiDexForTinkerForMemoryDex.java"


# annotations
.annotation system Ldalvik/annotation/EnclosingClass;
    value = Lcom/wrapper/proxyapplication/MultiDexForTinkerForMemoryDex;
.end annotation

.annotation system Ldalvik/annotation/InnerClass;
    accessFlags = 0x1a
    name = "V26"
.end annotation


# direct methods
.method private constructor <init>()V
    .locals 0

    .line 291
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    return-void
.end method

.method static synthetic access$000(Ljava/lang/ClassLoader;Ljava/lang/reflect/Field;[Ljava/nio/ByteBuffer;)V
    .locals 0
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/IllegalArgumentException;,
            Ljava/lang/IllegalAccessException;,
            Ljava/lang/NoSuchFieldException;,
            Ljava/lang/reflect/InvocationTargetException;,
            Ljava/lang/NoSuchMethodException;,
            Ljava/io/IOException;
        }
    .end annotation

    .line 291
    invoke-static {p0, p1, p2}, Lcom/wrapper/proxyapplication/MultiDexForTinkerForMemoryDex$V26;->install(Ljava/lang/ClassLoader;Ljava/lang/reflect/Field;[Ljava/nio/ByteBuffer;)V

    return-void
.end method

.method private static install(Ljava/lang/ClassLoader;Ljava/lang/reflect/Field;[Ljava/nio/ByteBuffer;)V
    .locals 4
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/IllegalArgumentException;,
            Ljava/lang/IllegalAccessException;,
            Ljava/lang/NoSuchFieldException;,
            Ljava/lang/reflect/InvocationTargetException;,
            Ljava/lang/NoSuchMethodException;,
            Ljava/io/IOException;
        }
    .end annotation

    .line 302
    invoke-virtual {p1, p0}, Ljava/lang/reflect/Field;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object p0

    .line 303
    new-instance p1, Ljava/util/ArrayList;

    invoke-direct {p1}, Ljava/util/ArrayList;-><init>()V

    .line 304
    invoke-static {p0, p2, p1}, Lcom/wrapper/proxyapplication/MultiDexForTinkerForMemoryDex$V26;->makeDexElements(Ljava/lang/Object;[Ljava/nio/ByteBuffer;Ljava/util/ArrayList;)[Ljava/lang/Object;

    move-result-object v0

    .line 306
    array-length v1, v0

    array-length p2, p2

    if-ne v1, p2, :cond_3

    const-string p2, "dexElements"

    .line 309
    invoke-static {p0, p2, v0}, Lcom/wrapper/proxyapplication/MultiDexForTinkerForMemoryDex;->access$100(Ljava/lang/Object;Ljava/lang/String;[Ljava/lang/Object;)V

    .line 310
    invoke-virtual {p1}, Ljava/util/ArrayList;->size()I

    move-result p2

    if-lez p2, :cond_2

    .line 311
    invoke-virtual {p1}, Ljava/util/ArrayList;->iterator()Ljava/util/Iterator;

    move-result-object p2

    :goto_0
    invoke-interface {p2}, Ljava/util/Iterator;->hasNext()Z

    move-result v0

    if-eqz v0, :cond_0

    invoke-interface {p2}, Ljava/util/Iterator;->next()Ljava/lang/Object;

    move-result-object v0

    check-cast v0, Ljava/io/IOException;

    goto :goto_0

    :cond_0
    const-string p2, "dexElementsSuppressedExceptions"

    .line 314
    invoke-static {p0, p2}, Lcom/wrapper/proxyapplication/MultiDexForTinkerForMemoryDex;->access$200(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object p2

    .line 316
    invoke-virtual {p2, p0}, Ljava/lang/reflect/Field;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v0

    check-cast v0, [Ljava/io/IOException;

    check-cast v0, [Ljava/io/IOException;

    if-nez v0, :cond_1

    .line 320
    invoke-virtual {p1}, Ljava/util/ArrayList;->size()I

    move-result v0

    new-array v0, v0, [Ljava/io/IOException;

    invoke-virtual {p1, v0}, Ljava/util/ArrayList;->toArray([Ljava/lang/Object;)[Ljava/lang/Object;

    move-result-object p1

    check-cast p1, [Ljava/io/IOException;

    goto :goto_1

    .line 322
    :cond_1
    invoke-virtual {p1}, Ljava/util/ArrayList;->size()I

    move-result v1

    array-length v2, v0

    add-int/2addr v1, v2

    new-array v1, v1, [Ljava/io/IOException;

    .line 324
    invoke-virtual {p1, v1}, Ljava/util/ArrayList;->toArray([Ljava/lang/Object;)[Ljava/lang/Object;

    const/4 v2, 0x0

    .line 325
    invoke-virtual {p1}, Ljava/util/ArrayList;->size()I

    move-result p1

    array-length v3, v0

    invoke-static {v0, v2, v1, p1, v3}, Ljava/lang/System;->arraycopy(Ljava/lang/Object;ILjava/lang/Object;II)V

    move-object p1, v1

    .line 330
    :goto_1
    invoke-virtual {p2, p0, p1}, Ljava/lang/reflect/Field;->set(Ljava/lang/Object;Ljava/lang/Object;)V

    :cond_2
    const/4 p0, 0x1

    .line 333
    sput p0, Lcom/wrapper/proxyapplication/MultiDexForTinkerForMemoryDex;->hasInjected:I

    return-void

    .line 307
    :cond_3
    new-instance p0, Ljava/io/IOException;

    const-string p1, "load dex failed"

    invoke-direct {p0, p1}, Ljava/io/IOException;-><init>(Ljava/lang/String;)V

    goto :goto_3

    :goto_2
    throw p0

    :goto_3
    goto :goto_2
.end method

.method private static makeDexElements(Ljava/lang/Object;[Ljava/nio/ByteBuffer;Ljava/util/ArrayList;)[Ljava/lang/Object;
    .locals 6
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "(",
            "Ljava/lang/Object;",
            "[",
            "Ljava/nio/ByteBuffer;",
            "Ljava/util/ArrayList<",
            "Ljava/io/IOException;",
            ">;)[",
            "Ljava/lang/Object;"
        }
    .end annotation

    :try_start_0
    const-string v0, "makeInMemoryDexElements"

    const/4 v1, 0x2

    new-array v2, v1, [Ljava/lang/Class;

    .line 345
    const-class v3, [Ljava/nio/ByteBuffer;

    const/4 v4, 0x0

    aput-object v3, v2, v4

    const-class v3, Ljava/util/List;

    const/4 v5, 0x1

    aput-object v3, v2, v5

    invoke-static {p0, v0, v2}, Lcom/wrapper/proxyapplication/MultiDexForTinkerForMemoryDex;->access$300(Ljava/lang/Object;Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v0
    :try_end_0
    .catch Ljava/lang/NoSuchMethodException; {:try_start_0 .. :try_end_0} :catch_4

    :try_start_1
    new-array v1, v1, [Ljava/lang/Object;

    aput-object p1, v1, v4

    aput-object p2, v1, v5

    .line 347
    invoke-virtual {v0, p0, v1}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object p0

    check-cast p0, [Ljava/lang/Object;

    check-cast p0, [Ljava/lang/Object;
    :try_end_1
    .catch Ljava/lang/IllegalAccessException; {:try_start_1 .. :try_end_1} :catch_3
    .catch Ljava/lang/IllegalArgumentException; {:try_start_1 .. :try_end_1} :catch_2
    .catch Ljava/lang/reflect/InvocationTargetException; {:try_start_1 .. :try_end_1} :catch_1
    .catch Ljava/lang/RuntimeException; {:try_start_1 .. :try_end_1} :catch_0
    .catch Ljava/lang/NoSuchMethodException; {:try_start_1 .. :try_end_1} :catch_4

    return-object p0

    :catch_0
    move-exception p0

    .line 359
    :try_start_2
    invoke-virtual {p0}, Ljava/lang/RuntimeException;->printStackTrace()V

    goto :goto_0

    :catch_1
    move-exception p0

    .line 356
    invoke-virtual {p0}, Ljava/lang/reflect/InvocationTargetException;->printStackTrace()V

    goto :goto_0

    :catch_2
    move-exception p0

    .line 353
    invoke-virtual {p0}, Ljava/lang/IllegalArgumentException;->printStackTrace()V

    goto :goto_0

    :catch_3
    move-exception p0

    .line 350
    invoke-virtual {p0}, Ljava/lang/IllegalAccessException;->printStackTrace()V
    :try_end_2
    .catch Ljava/lang/NoSuchMethodException; {:try_start_2 .. :try_end_2} :catch_4

    goto :goto_0

    :catch_4
    move-exception p0

    .line 363
    invoke-virtual {p0}, Ljava/lang/NoSuchMethodException;->printStackTrace()V

    :goto_0
    const/4 p0, 0x0

    return-object p0
.end method
