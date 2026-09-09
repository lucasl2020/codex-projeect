.class public final Lcom/wrapper/proxyapplication/MultiDex;
.super Ljava/lang/Object;
.source "MultiDex.java"


# annotations
.annotation system Ldalvik/annotation/MemberClasses;
    value = {
        Lcom/wrapper/proxyapplication/MultiDex$V4;,
        Lcom/wrapper/proxyapplication/MultiDex$V19;
    }
.end annotation


# static fields
.field static final TAG:Ljava/lang/String; = "MultiDex"

.field static baseApkDexFile:Ljava/lang/Object;

.field static dexElementsSuppressedExceptions:[Ljava/io/IOException;

.field static hasInjected:I

.field static injectDexBeginIndex:I

.field static injectDexsObj:[Ljava/lang/Object;

.field static injectFilesObj:[Ljava/lang/Object;

.field static injectPathListObj:[Ljava/lang/Object;

.field static injectPathsObj:[Ljava/lang/Object;

.field static injectZipsObj:[Ljava/lang/Object;


# direct methods
.method static constructor <clinit>()V
    .locals 0

    return-void
.end method

.method private constructor <init>()V
    .locals 0

    .line 74
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    return-void
.end method

.method static synthetic access$400(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;
    .locals 0
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/NoSuchFieldException;
        }
    .end annotation

    .line 50
    invoke-static {p0, p1}, Lcom/wrapper/proxyapplication/MultiDex;->findField(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object p0

    return-object p0
.end method

.method static synthetic access$500(Ljava/lang/Object;Ljava/lang/String;[Ljava/lang/Object;)V
    .locals 0
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/NoSuchFieldException;,
            Ljava/lang/IllegalArgumentException;,
            Ljava/lang/IllegalAccessException;
        }
    .end annotation

    .line 50
    invoke-static {p0, p1, p2}, Lcom/wrapper/proxyapplication/MultiDex;->expandFieldArray(Ljava/lang/Object;Ljava/lang/String;[Ljava/lang/Object;)V

    return-void
.end method

.method static synthetic access$600(Ljava/lang/Object;Ljava/lang/String;[Ljava/lang/Object;I)V
    .locals 0
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/NoSuchFieldException;,
            Ljava/lang/IllegalArgumentException;,
            Ljava/lang/IllegalAccessException;
        }
    .end annotation

    .line 50
    invoke-static {p0, p1, p2, p3}, Lcom/wrapper/proxyapplication/MultiDex;->expandFieldArray(Ljava/lang/Object;Ljava/lang/String;[Ljava/lang/Object;I)V

    return-void
.end method

.method static synthetic access$700(Ljava/lang/Object;Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;
    .locals 0
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/NoSuchMethodException;
        }
    .end annotation

    .line 50
    invoke-static {p0, p1, p2}, Lcom/wrapper/proxyapplication/MultiDex;->findMethod(Ljava/lang/Object;Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object p0

    return-object p0
.end method

.method static synthetic access$800(Ljava/lang/String;)Ljava/lang/String;
    .locals 0

    .line 50
    invoke-static {p0}, Lcom/wrapper/proxyapplication/MultiDex;->getprefixname(Ljava/lang/String;)Ljava/lang/String;

    move-result-object p0

    return-object p0
.end method

.method private static expandFieldArray(Ljava/lang/Object;Ljava/lang/String;[Ljava/lang/Object;)V
    .locals 6
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/NoSuchFieldException;,
            Ljava/lang/IllegalArgumentException;,
            Ljava/lang/IllegalAccessException;
        }
    .end annotation

    .line 625
    invoke-static {p0, p1}, Lcom/wrapper/proxyapplication/MultiDex;->findField(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object p1

    .line 626
    invoke-virtual {p1, p0}, Ljava/lang/reflect/Field;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v0

    check-cast v0, [Ljava/lang/Object;

    check-cast v0, [Ljava/lang/Object;

    .line 627
    invoke-virtual {v0}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v1

    invoke-virtual {v1}, Ljava/lang/Class;->getComponentType()Ljava/lang/Class;

    move-result-object v1

    array-length v2, v0

    array-length v3, p2

    add-int/2addr v2, v3

    invoke-static {v1, v2}, Ljava/lang/reflect/Array;->newInstance(Ljava/lang/Class;I)Ljava/lang/Object;

    move-result-object v1

    check-cast v1, [Ljava/lang/Object;

    check-cast v1, [Ljava/lang/Object;

    .line 629
    sget v2, Landroid/os/Build$VERSION;->SDK_INT:I

    const/4 v3, 0x0

    const/16 v4, 0x1c

    if-ne v2, v4, :cond_0

    sget v2, Lcom/wrapper/proxyapplication/MultiDex;->hasInjected:I

    if-nez v2, :cond_0

    array-length v2, v0

    const/4 v4, 0x1

    if-le v2, v4, :cond_0

    .line 630
    array-length v2, v0

    sub-int/2addr v2, v4

    invoke-static {v0, v3, v1, v3, v2}, Ljava/lang/System;->arraycopy(Ljava/lang/Object;ILjava/lang/Object;II)V

    .line 631
    array-length v2, v0

    sub-int/2addr v2, v4

    array-length v5, p2

    invoke-static {p2, v3, v1, v2, v5}, Ljava/lang/System;->arraycopy(Ljava/lang/Object;ILjava/lang/Object;II)V

    .line 632
    array-length v2, v0

    sub-int/2addr v2, v4

    array-length p2, p2

    array-length v3, v0

    add-int/2addr p2, v3

    sub-int/2addr p2, v4

    invoke-static {v0, v2, v1, p2, v4}, Ljava/lang/System;->arraycopy(Ljava/lang/Object;ILjava/lang/Object;II)V

    goto :goto_0

    .line 634
    :cond_0
    array-length v2, p2

    invoke-static {p2, v3, v1, v3, v2}, Ljava/lang/System;->arraycopy(Ljava/lang/Object;ILjava/lang/Object;II)V

    .line 635
    array-length p2, p2

    array-length v2, v0

    invoke-static {v0, v3, v1, p2, v2}, Ljava/lang/System;->arraycopy(Ljava/lang/Object;ILjava/lang/Object;II)V

    .line 637
    :goto_0
    invoke-virtual {p1, p0, v1}, Ljava/lang/reflect/Field;->set(Ljava/lang/Object;Ljava/lang/Object;)V

    return-void
.end method

.method private static expandFieldArray(Ljava/lang/Object;Ljava/lang/String;[Ljava/lang/Object;I)V
    .locals 1
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/NoSuchFieldException;,
            Ljava/lang/IllegalArgumentException;,
            Ljava/lang/IllegalAccessException;
        }
    .end annotation

    const-string p0, "dexElements"

    .line 644
    invoke-virtual {p1, p0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result p0

    const/4 v0, 0x0

    if-eqz p0, :cond_0

    .line 645
    sget-object p0, Lcom/wrapper/proxyapplication/MultiDex;->injectPathListObj:[Ljava/lang/Object;

    sget p1, Lcom/wrapper/proxyapplication/MultiDex;->injectDexBeginIndex:I

    add-int/2addr p1, p3

    array-length p3, p2

    invoke-static {p2, v0, p0, p1, p3}, Ljava/lang/System;->arraycopy(Ljava/lang/Object;ILjava/lang/Object;II)V

    goto :goto_0

    :cond_0
    const-string p0, "mPaths"

    .line 646
    invoke-virtual {p1, p0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result p0

    if-eqz p0, :cond_1

    .line 647
    sget-object p0, Lcom/wrapper/proxyapplication/MultiDex;->injectPathsObj:[Ljava/lang/Object;

    sget p1, Lcom/wrapper/proxyapplication/MultiDex;->injectDexBeginIndex:I

    add-int/2addr p1, p3

    array-length p3, p2

    invoke-static {p2, v0, p0, p1, p3}, Ljava/lang/System;->arraycopy(Ljava/lang/Object;ILjava/lang/Object;II)V

    goto :goto_0

    :cond_1
    const-string p0, "mFiles"

    .line 648
    invoke-virtual {p1, p0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result p0

    if-eqz p0, :cond_2

    .line 649
    sget-object p0, Lcom/wrapper/proxyapplication/MultiDex;->injectFilesObj:[Ljava/lang/Object;

    sget p1, Lcom/wrapper/proxyapplication/MultiDex;->injectDexBeginIndex:I

    add-int/2addr p1, p3

    array-length p3, p2

    invoke-static {p2, v0, p0, p1, p3}, Ljava/lang/System;->arraycopy(Ljava/lang/Object;ILjava/lang/Object;II)V

    goto :goto_0

    :cond_2
    const-string p0, "mDexs"

    .line 650
    invoke-virtual {p1, p0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result p0

    if-eqz p0, :cond_3

    .line 651
    sget-object p0, Lcom/wrapper/proxyapplication/MultiDex;->injectDexsObj:[Ljava/lang/Object;

    sget p1, Lcom/wrapper/proxyapplication/MultiDex;->injectDexBeginIndex:I

    add-int/2addr p1, p3

    array-length p3, p2

    invoke-static {p2, v0, p0, p1, p3}, Ljava/lang/System;->arraycopy(Ljava/lang/Object;ILjava/lang/Object;II)V

    goto :goto_0

    :cond_3
    const-string p0, "mZips"

    .line 652
    invoke-virtual {p1, p0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result p0

    if-eqz p0, :cond_4

    .line 653
    sget-object p0, Lcom/wrapper/proxyapplication/MultiDex;->injectZipsObj:[Ljava/lang/Object;

    sget p1, Lcom/wrapper/proxyapplication/MultiDex;->injectDexBeginIndex:I

    add-int/2addr p1, p3

    array-length p3, p2

    invoke-static {p2, v0, p0, p1, p3}, Ljava/lang/System;->arraycopy(Ljava/lang/Object;ILjava/lang/Object;II)V

    :cond_4
    :goto_0
    return-void
.end method

.method private static findField(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;
    .locals 3
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/NoSuchFieldException;
        }
    .end annotation

    .line 551
    invoke-virtual {p0}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v0

    :goto_0
    if-eqz v0, :cond_1

    .line 553
    :try_start_0
    invoke-virtual {v0, p1}, Ljava/lang/Class;->getDeclaredField(Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v1

    .line 554
    invoke-virtual {v1}, Ljava/lang/reflect/Field;->isAccessible()Z

    move-result v2

    if-nez v2, :cond_0

    const/4 v2, 0x1

    .line 555
    invoke-virtual {v1, v2}, Ljava/lang/reflect/Field;->setAccessible(Z)V
    :try_end_0
    .catch Ljava/lang/NoSuchFieldException; {:try_start_0 .. :try_end_0} :catch_0

    :cond_0
    return-object v1

    .line 551
    :catch_0
    invoke-virtual {v0}, Ljava/lang/Class;->getSuperclass()Ljava/lang/Class;

    move-result-object v0

    goto :goto_0

    .line 563
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

.method private static varargs findMethod(Ljava/lang/Object;Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;
    .locals 3
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "(",
            "Ljava/lang/Object;",
            "Ljava/lang/String;",
            "[",
            "Ljava/lang/Class<",
            "*>;)",
            "Ljava/lang/reflect/Method;"
        }
    .end annotation

    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/NoSuchMethodException;
        }
    .end annotation

    .line 595
    invoke-virtual {p0}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v0

    :goto_0
    if-eqz v0, :cond_1

    .line 597
    :try_start_0
    invoke-virtual {v0, p1, p2}, Ljava/lang/Class;->getDeclaredMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v1

    .line 599
    invoke-virtual {v1}, Ljava/lang/reflect/Method;->isAccessible()Z

    move-result v2

    if-nez v2, :cond_0

    const/4 v2, 0x1

    .line 600
    invoke-virtual {v1, v2}, Ljava/lang/reflect/Method;->setAccessible(Z)V
    :try_end_0
    .catch Ljava/lang/NoSuchMethodException; {:try_start_0 .. :try_end_0} :catch_0

    :cond_0
    return-object v1

    .line 595
    :catch_0
    invoke-virtual {v0}, Ljava/lang/Class;->getSuperclass()Ljava/lang/Class;

    move-result-object v0

    goto :goto_0

    .line 609
    :cond_1
    new-instance v0, Ljava/lang/NoSuchMethodException;

    new-instance v1, Ljava/lang/StringBuilder;

    invoke-direct {v1}, Ljava/lang/StringBuilder;-><init>()V

    const-string v2, "Method "

    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v1, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string p1, " with parameters "

    invoke-virtual {v1, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-static {p2}, Ljava/util/Arrays;->asList([Ljava/lang/Object;)Ljava/util/List;

    move-result-object p1

    invoke-virtual {v1, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;

    const-string p1, " not found in "

    invoke-virtual {v1, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 610
    invoke-virtual {p0}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object p0

    invoke-virtual {v1, p0}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;

    invoke-virtual {v1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p0

    invoke-direct {v0, p0}, Ljava/lang/NoSuchMethodException;-><init>(Ljava/lang/String;)V

    goto :goto_2

    :goto_1
    throw v0

    :goto_2
    goto :goto_1
.end method

.method private static varargs findMethodinClazz(Ljava/lang/Class;Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;
    .locals 3
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "(",
            "Ljava/lang/Class<",
            "*>;",
            "Ljava/lang/String;",
            "[",
            "Ljava/lang/Class<",
            "*>;)",
            "Ljava/lang/reflect/Method;"
        }
    .end annotation

    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/NoSuchMethodException;
        }
    .end annotation

    :goto_0
    if-eqz p0, :cond_1

    .line 570
    :try_start_0
    invoke-virtual {p0, p1, p2}, Ljava/lang/Class;->getDeclaredMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v0

    .line 571
    invoke-virtual {v0}, Ljava/lang/reflect/Method;->isAccessible()Z

    move-result v1

    if-nez v1, :cond_0

    const/4 v1, 0x1

    .line 572
    invoke-virtual {v0, v1}, Ljava/lang/reflect/Method;->setAccessible(Z)V
    :try_end_0
    .catch Ljava/lang/NoSuchMethodException; {:try_start_0 .. :try_end_0} :catch_0

    :cond_0
    return-object v0

    .line 568
    :catch_0
    invoke-virtual {p0}, Ljava/lang/Class;->getSuperclass()Ljava/lang/Class;

    move-result-object p0

    goto :goto_0

    .line 580
    :cond_1
    new-instance v0, Ljava/lang/NoSuchMethodException;

    new-instance v1, Ljava/lang/StringBuilder;

    invoke-direct {v1}, Ljava/lang/StringBuilder;-><init>()V

    const-string v2, "Method "

    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v1, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string p1, " with parameters "

    invoke-virtual {v1, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 581
    invoke-static {p2}, Ljava/util/Arrays;->asList([Ljava/lang/Object;)Ljava/util/List;

    move-result-object p1

    invoke-virtual {v1, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;

    const-string p1, " not found in "

    invoke-virtual {v1, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v1, p0}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;

    invoke-virtual {v1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p0

    invoke-direct {v0, p0}, Ljava/lang/NoSuchMethodException;-><init>(Ljava/lang/String;)V

    goto :goto_2

    :goto_1
    throw v0

    :goto_2
    goto :goto_1
.end method

.method private static finishinstallDexes(Ljava/lang/ClassLoader;)V
    .locals 4

    const/4 v0, 0x1

    :try_start_0
    const-string v1, "pathList"

    .line 487
    invoke-static {p0, v1}, Lcom/wrapper/proxyapplication/MultiDex;->findField(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v1
    :try_end_0
    .catch Ljava/lang/NoSuchFieldException; {:try_start_0 .. :try_end_0} :catch_2

    .line 489
    :try_start_1
    invoke-virtual {v1, p0}, Ljava/lang/reflect/Field;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v1

    const-string v2, "dexElements"

    .line 490
    invoke-static {v1, v2}, Lcom/wrapper/proxyapplication/MultiDex;->findField(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v2

    .line 491
    sput v0, Lcom/wrapper/proxyapplication/MultiDex;->hasInjected:I

    .line 493
    sget-object v3, Lcom/wrapper/proxyapplication/MultiDex;->injectPathListObj:[Ljava/lang/Object;

    invoke-virtual {v2, v1, v3}, Ljava/lang/reflect/Field;->set(Ljava/lang/Object;Ljava/lang/Object;)V

    .line 494
    sget-object v2, Lcom/wrapper/proxyapplication/MultiDex;->dexElementsSuppressedExceptions:[Ljava/io/IOException;

    if-eqz v2, :cond_0

    const-string v2, "dexElementsSuppressedExceptions"

    .line 495
    invoke-static {v1, v2}, Lcom/wrapper/proxyapplication/MultiDex;->findField(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v2

    .line 496
    sget-object v3, Lcom/wrapper/proxyapplication/MultiDex;->dexElementsSuppressedExceptions:[Ljava/io/IOException;

    invoke-virtual {v2, v1, v3}, Ljava/lang/reflect/Field;->set(Ljava/lang/Object;Ljava/lang/Object;)V
    :try_end_1
    .catch Ljava/lang/IllegalArgumentException; {:try_start_1 .. :try_end_1} :catch_1
    .catch Ljava/lang/IllegalAccessException; {:try_start_1 .. :try_end_1} :catch_0
    .catch Ljava/lang/NoSuchFieldException; {:try_start_1 .. :try_end_1} :catch_2

    goto :goto_0

    :catch_0
    move-exception v1

    .line 503
    :try_start_2
    invoke-virtual {v1}, Ljava/lang/IllegalAccessException;->printStackTrace()V

    goto :goto_0

    :catch_1
    move-exception v1

    .line 500
    invoke-virtual {v1}, Ljava/lang/IllegalArgumentException;->printStackTrace()V
    :try_end_2
    .catch Ljava/lang/NoSuchFieldException; {:try_start_2 .. :try_end_2} :catch_2

    goto :goto_0

    :catch_2
    :try_start_3
    const-string v1, "path"

    .line 508
    invoke-static {p0, v1}, Lcom/wrapper/proxyapplication/MultiDex;->findField(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v1
    :try_end_3
    .catch Ljava/lang/NoSuchFieldException; {:try_start_3 .. :try_end_3} :catch_5

    .line 510
    :try_start_4
    invoke-virtual {v1, p0}, Ljava/lang/reflect/Field;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object p0

    const-string v1, "mPaths"

    .line 511
    invoke-static {p0, v1}, Lcom/wrapper/proxyapplication/MultiDex;->findField(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v1

    .line 513
    sget-object v2, Lcom/wrapper/proxyapplication/MultiDex;->injectPathsObj:[Ljava/lang/Object;

    invoke-virtual {v1, p0, v2}, Ljava/lang/reflect/Field;->set(Ljava/lang/Object;Ljava/lang/Object;)V

    const-string v1, "mFiles"

    .line 515
    invoke-static {p0, v1}, Lcom/wrapper/proxyapplication/MultiDex;->findField(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v1

    .line 517
    sget-object v2, Lcom/wrapper/proxyapplication/MultiDex;->injectFilesObj:[Ljava/lang/Object;

    invoke-virtual {v1, p0, v2}, Ljava/lang/reflect/Field;->set(Ljava/lang/Object;Ljava/lang/Object;)V

    const-string v1, "mZips"

    .line 519
    invoke-static {p0, v1}, Lcom/wrapper/proxyapplication/MultiDex;->findField(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v1

    .line 521
    sget-object v2, Lcom/wrapper/proxyapplication/MultiDex;->injectZipsObj:[Ljava/lang/Object;

    invoke-virtual {v1, p0, v2}, Ljava/lang/reflect/Field;->set(Ljava/lang/Object;Ljava/lang/Object;)V

    const-string v1, "mDexs"

    .line 523
    invoke-static {p0, v1}, Lcom/wrapper/proxyapplication/MultiDex;->findField(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v1

    .line 525
    sget-object v2, Lcom/wrapper/proxyapplication/MultiDex;->injectDexsObj:[Ljava/lang/Object;

    invoke-virtual {v1, p0, v2}, Ljava/lang/reflect/Field;->set(Ljava/lang/Object;Ljava/lang/Object;)V

    .line 526
    sput v0, Lcom/wrapper/proxyapplication/MultiDex;->hasInjected:I
    :try_end_4
    .catch Ljava/lang/IllegalArgumentException; {:try_start_4 .. :try_end_4} :catch_4
    .catch Ljava/lang/IllegalAccessException; {:try_start_4 .. :try_end_4} :catch_3
    .catch Ljava/lang/NoSuchFieldException; {:try_start_4 .. :try_end_4} :catch_5

    goto :goto_0

    :catch_3
    move-exception p0

    .line 532
    :try_start_5
    invoke-virtual {p0}, Ljava/lang/IllegalAccessException;->printStackTrace()V

    goto :goto_0

    :catch_4
    move-exception p0

    .line 529
    invoke-virtual {p0}, Ljava/lang/IllegalArgumentException;->printStackTrace()V
    :try_end_5
    .catch Ljava/lang/NoSuchFieldException; {:try_start_5 .. :try_end_5} :catch_5

    :catch_5
    :cond_0
    :goto_0
    return-void
.end method

.method private static getprefixname(Ljava/lang/String;)Ljava/lang/String;
    .locals 2

    const-string v0, "/"

    .line 274
    invoke-virtual {p0, v0}, Ljava/lang/String;->lastIndexOf(Ljava/lang/String;)I

    move-result v0

    if-ltz v0, :cond_0

    add-int/lit8 v0, v0, 0x1

    .line 277
    invoke-virtual {p0, v0}, Ljava/lang/String;->substring(I)Ljava/lang/String;

    move-result-object p0

    :cond_0
    const-string v0, "."

    .line 284
    invoke-virtual {p0, v0}, Ljava/lang/String;->lastIndexOf(Ljava/lang/String;)I

    move-result v0

    if-ltz v0, :cond_1

    const/4 v1, 0x0

    .line 287
    invoke-virtual {p0, v1, v0}, Ljava/lang/String;->substring(II)Ljava/lang/String;

    move-result-object p0

    :cond_1
    return-object p0
.end method

.method private static installDexes(Ljava/lang/ClassLoader;Ljava/lang/String;Ljava/lang/String;IZZ)Ljava/util/ArrayList;
    .locals 8
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "(",
            "Ljava/lang/ClassLoader;",
            "Ljava/lang/String;",
            "Ljava/lang/String;",
            "IZZ)",
            "Ljava/util/ArrayList<",
            "Ljava/lang/Object;",
            ">;"
        }
    .end annotation

    .line 396
    invoke-static {p1}, Lcom/wrapper/proxyapplication/MultiDex;->splitPaths(Ljava/lang/String;)Ljava/util/ArrayList;

    move-result-object p1

    .line 397
    new-instance v7, Ljava/io/File;

    invoke-direct {v7, p2}, Ljava/io/File;-><init>(Ljava/lang/String;)V

    :try_start_0
    const-string p2, "pathList"

    .line 399
    invoke-static {p0, p2}, Lcom/wrapper/proxyapplication/MultiDex;->findField(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v1
    :try_end_0
    .catch Ljava/lang/NoSuchFieldException; {:try_start_0 .. :try_end_0} :catch_4

    move-object v0, p0

    move-object v2, p1

    move-object v3, v7

    move v4, p3

    move v5, p4

    move v6, p5

    .line 401
    :try_start_1
    invoke-static/range {v0 .. v6}, Lcom/wrapper/proxyapplication/MultiDex$V19;->access$200(Ljava/lang/ClassLoader;Ljava/lang/reflect/Field;Ljava/util/List;Ljava/io/File;IZZ)Ljava/util/ArrayList;

    move-result-object p0
    :try_end_1
    .catch Ljava/lang/IllegalArgumentException; {:try_start_1 .. :try_end_1} :catch_3
    .catch Ljava/lang/IllegalAccessException; {:try_start_1 .. :try_end_1} :catch_2
    .catch Ljava/lang/reflect/InvocationTargetException; {:try_start_1 .. :try_end_1} :catch_1
    .catch Ljava/lang/NoSuchMethodException; {:try_start_1 .. :try_end_1} :catch_0
    .catch Ljava/lang/NoSuchFieldException; {:try_start_1 .. :try_end_1} :catch_4

    return-object p0

    :catch_0
    move-exception p2

    .line 414
    :try_start_2
    invoke-virtual {p2}, Ljava/lang/NoSuchMethodException;->printStackTrace()V

    goto :goto_0

    :catch_1
    move-exception p2

    .line 411
    invoke-virtual {p2}, Ljava/lang/reflect/InvocationTargetException;->printStackTrace()V

    goto :goto_0

    :catch_2
    move-exception p2

    .line 408
    invoke-virtual {p2}, Ljava/lang/IllegalAccessException;->printStackTrace()V

    goto :goto_0

    :catch_3
    move-exception p2

    .line 405
    invoke-virtual {p2}, Ljava/lang/IllegalArgumentException;->printStackTrace()V
    :try_end_2
    .catch Ljava/lang/NoSuchFieldException; {:try_start_2 .. :try_end_2} :catch_4

    goto :goto_0

    :catch_4
    :try_start_3
    const-string p2, "path"

    .line 420
    invoke-static {p0, p2}, Lcom/wrapper/proxyapplication/MultiDex;->findField(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object p2
    :try_end_3
    .catch Ljava/lang/NoSuchFieldException; {:try_start_3 .. :try_end_3} :catch_8

    .line 422
    :try_start_4
    invoke-static {p0, p2, p1, v7, p3}, Lcom/wrapper/proxyapplication/MultiDex$V4;->access$300(Ljava/lang/ClassLoader;Ljava/lang/reflect/Field;Ljava/util/List;Ljava/io/File;I)Ljava/util/ArrayList;

    move-result-object p0
    :try_end_4
    .catch Ljava/lang/IllegalArgumentException; {:try_start_4 .. :try_end_4} :catch_7
    .catch Ljava/lang/IllegalAccessException; {:try_start_4 .. :try_end_4} :catch_6
    .catch Ljava/io/IOException; {:try_start_4 .. :try_end_4} :catch_5
    .catch Ljava/lang/NoSuchFieldException; {:try_start_4 .. :try_end_4} :catch_8

    return-object p0

    :catch_5
    move-exception p0

    .line 431
    :try_start_5
    invoke-virtual {p0}, Ljava/io/IOException;->printStackTrace()V

    goto :goto_0

    :catch_6
    move-exception p0

    .line 428
    invoke-virtual {p0}, Ljava/lang/IllegalAccessException;->printStackTrace()V

    goto :goto_0

    :catch_7
    move-exception p0

    .line 425
    invoke-virtual {p0}, Ljava/lang/IllegalArgumentException;->printStackTrace()V
    :try_end_5
    .catch Ljava/lang/NoSuchFieldException; {:try_start_5 .. :try_end_5} :catch_8

    :catch_8
    :goto_0
    const/4 p0, 0x0

    return-object p0
.end method

.method private static installDexes(Ljava/lang/ClassLoader;Ljava/lang/String;Ljava/lang/String;ZZ)Ljava/util/ArrayList;
    .locals 7
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "(",
            "Ljava/lang/ClassLoader;",
            "Ljava/lang/String;",
            "Ljava/lang/String;",
            "ZZ)",
            "Ljava/util/ArrayList<",
            "Ljava/lang/Object;",
            ">;"
        }
    .end annotation

    .line 347
    invoke-static {p1}, Lcom/wrapper/proxyapplication/MultiDex;->splitPaths(Ljava/lang/String;)Ljava/util/ArrayList;

    move-result-object p1

    .line 348
    new-instance v6, Ljava/io/File;

    invoke-direct {v6, p2}, Ljava/io/File;-><init>(Ljava/lang/String;)V

    :try_start_0
    const-string p2, "pathList"

    .line 350
    invoke-static {p0, p2}, Lcom/wrapper/proxyapplication/MultiDex;->findField(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v1
    :try_end_0
    .catch Ljava/lang/NoSuchFieldException; {:try_start_0 .. :try_end_0} :catch_4

    move-object v0, p0

    move-object v2, p1

    move-object v3, v6

    move v4, p3

    move v5, p4

    .line 352
    :try_start_1
    invoke-static/range {v0 .. v5}, Lcom/wrapper/proxyapplication/MultiDex$V19;->access$000(Ljava/lang/ClassLoader;Ljava/lang/reflect/Field;Ljava/util/List;Ljava/io/File;ZZ)Ljava/util/ArrayList;

    move-result-object p0
    :try_end_1
    .catch Ljava/lang/IllegalArgumentException; {:try_start_1 .. :try_end_1} :catch_3
    .catch Ljava/lang/IllegalAccessException; {:try_start_1 .. :try_end_1} :catch_2
    .catch Ljava/lang/reflect/InvocationTargetException; {:try_start_1 .. :try_end_1} :catch_1
    .catch Ljava/lang/NoSuchMethodException; {:try_start_1 .. :try_end_1} :catch_0
    .catch Ljava/lang/NoSuchFieldException; {:try_start_1 .. :try_end_1} :catch_4

    return-object p0

    :catch_0
    move-exception p2

    .line 364
    :try_start_2
    invoke-virtual {p2}, Ljava/lang/NoSuchMethodException;->printStackTrace()V

    goto :goto_0

    :catch_1
    move-exception p2

    .line 361
    invoke-virtual {p2}, Ljava/lang/reflect/InvocationTargetException;->printStackTrace()V

    goto :goto_0

    :catch_2
    move-exception p2

    .line 358
    invoke-virtual {p2}, Ljava/lang/IllegalAccessException;->printStackTrace()V

    goto :goto_0

    :catch_3
    move-exception p2

    .line 355
    invoke-virtual {p2}, Ljava/lang/IllegalArgumentException;->printStackTrace()V
    :try_end_2
    .catch Ljava/lang/NoSuchFieldException; {:try_start_2 .. :try_end_2} :catch_4

    goto :goto_0

    :catch_4
    :try_start_3
    const-string p2, "path"

    .line 370
    invoke-static {p0, p2}, Lcom/wrapper/proxyapplication/MultiDex;->findField(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object p2
    :try_end_3
    .catch Ljava/lang/NoSuchFieldException; {:try_start_3 .. :try_end_3} :catch_8

    .line 372
    :try_start_4
    invoke-static {p0, p2, p1, v6}, Lcom/wrapper/proxyapplication/MultiDex$V4;->access$100(Ljava/lang/ClassLoader;Ljava/lang/reflect/Field;Ljava/util/List;Ljava/io/File;)Ljava/util/ArrayList;

    move-result-object p0
    :try_end_4
    .catch Ljava/lang/IllegalArgumentException; {:try_start_4 .. :try_end_4} :catch_7
    .catch Ljava/lang/IllegalAccessException; {:try_start_4 .. :try_end_4} :catch_6
    .catch Ljava/io/IOException; {:try_start_4 .. :try_end_4} :catch_5
    .catch Ljava/lang/NoSuchFieldException; {:try_start_4 .. :try_end_4} :catch_8

    return-object p0

    :catch_5
    move-exception p0

    .line 382
    :try_start_5
    invoke-virtual {p0}, Ljava/io/IOException;->printStackTrace()V

    goto :goto_0

    :catch_6
    move-exception p0

    .line 379
    invoke-virtual {p0}, Ljava/lang/IllegalAccessException;->printStackTrace()V

    goto :goto_0

    :catch_7
    move-exception p0

    .line 376
    invoke-virtual {p0}, Ljava/lang/IllegalArgumentException;->printStackTrace()V
    :try_end_5
    .catch Ljava/lang/NoSuchFieldException; {:try_start_5 .. :try_end_5} :catch_8

    :catch_8
    :goto_0
    const/4 p0, 0x0

    return-object p0
.end method

.method private static openallDexes(Ljava/lang/ClassLoader;Ljava/lang/String;Ljava/lang/String;)Ljava/util/ArrayList;
    .locals 7
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "(",
            "Ljava/lang/ClassLoader;",
            "Ljava/lang/String;",
            "Ljava/lang/String;",
            ")",
            "Ljava/util/ArrayList<",
            "Ljava/lang/Object;",
            ">;"
        }
    .end annotation

    .line 299
    invoke-static {p1}, Lcom/wrapper/proxyapplication/MultiDex;->splitPaths(Ljava/lang/String;)Ljava/util/ArrayList;

    move-result-object p1

    .line 300
    new-instance v0, Ljava/io/File;

    invoke-direct {v0, p2}, Ljava/io/File;-><init>(Ljava/lang/String;)V

    const/4 p2, 0x0

    :try_start_0
    const-string v1, "pathList"

    .line 305
    invoke-static {p0, v1}, Lcom/wrapper/proxyapplication/MultiDex;->findField(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v1
    :try_end_0
    .catch Ljava/lang/NoSuchFieldException; {:try_start_0 .. :try_end_0} :catch_9

    .line 307
    :try_start_1
    invoke-virtual {v1, p0}, Ljava/lang/reflect/Field;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object p0
    :try_end_1
    .catch Ljava/lang/IllegalAccessException; {:try_start_1 .. :try_end_1} :catch_8
    .catch Ljava/lang/IllegalArgumentException; {:try_start_1 .. :try_end_1} :catch_7
    .catch Ljava/lang/NoSuchFieldException; {:try_start_1 .. :try_end_1} :catch_9

    :try_start_2
    const-string v1, "loadDexFile"

    const/4 v2, 0x2

    new-array v3, v2, [Ljava/lang/Class;

    .line 309
    const-class v4, Ljava/io/File;

    const/4 v5, 0x0

    aput-object v4, v3, v5

    const-class v4, Ljava/io/File;

    const/4 v6, 0x1

    aput-object v4, v3, v6

    invoke-static {p0, v1, v3}, Lcom/wrapper/proxyapplication/MultiDex;->findMethod(Ljava/lang/Object;Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v1
    :try_end_2
    .catch Ljava/lang/NoSuchMethodException; {:try_start_2 .. :try_end_2} :catch_6
    .catch Ljava/lang/IllegalAccessException; {:try_start_2 .. :try_end_2} :catch_8
    .catch Ljava/lang/IllegalArgumentException; {:try_start_2 .. :try_end_2} :catch_7
    .catch Ljava/lang/NoSuchFieldException; {:try_start_2 .. :try_end_2} :catch_9

    .line 311
    :try_start_3
    new-instance v3, Ljava/util/ArrayList;

    invoke-direct {v3}, Ljava/util/ArrayList;-><init>()V
    :try_end_3
    .catch Ljava/lang/reflect/InvocationTargetException; {:try_start_3 .. :try_end_3} :catch_5
    .catch Ljava/lang/NoSuchMethodException; {:try_start_3 .. :try_end_3} :catch_6
    .catch Ljava/lang/IllegalAccessException; {:try_start_3 .. :try_end_3} :catch_8
    .catch Ljava/lang/IllegalArgumentException; {:try_start_3 .. :try_end_3} :catch_7
    .catch Ljava/lang/NoSuchFieldException; {:try_start_3 .. :try_end_3} :catch_9

    .line 312
    :try_start_4
    invoke-virtual {p1}, Ljava/util/ArrayList;->iterator()Ljava/util/Iterator;

    move-result-object p1

    .line 313
    :goto_0
    invoke-interface {p1}, Ljava/util/Iterator;->hasNext()Z

    move-result p2

    if-eqz p2, :cond_0

    new-array p2, v2, [Ljava/lang/Object;

    .line 314
    invoke-interface {p1}, Ljava/util/Iterator;->next()Ljava/lang/Object;

    move-result-object v4

    aput-object v4, p2, v5

    aput-object v0, p2, v6

    invoke-virtual {v1, p0, p2}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object p2

    .line 315
    invoke-virtual {v3, p2}, Ljava/util/ArrayList;->add(Ljava/lang/Object;)Z
    :try_end_4
    .catch Ljava/lang/reflect/InvocationTargetException; {:try_start_4 .. :try_end_4} :catch_4
    .catch Ljava/lang/NoSuchMethodException; {:try_start_4 .. :try_end_4} :catch_3
    .catch Ljava/lang/IllegalAccessException; {:try_start_4 .. :try_end_4} :catch_2
    .catch Ljava/lang/IllegalArgumentException; {:try_start_4 .. :try_end_4} :catch_1
    .catch Ljava/lang/NoSuchFieldException; {:try_start_4 .. :try_end_4} :catch_0

    goto :goto_0

    :cond_0
    move-object p2, v3

    goto :goto_6

    :catch_0
    move-exception p0

    move-object p2, v3

    goto :goto_5

    :catch_1
    move-exception p0

    move-object p2, v3

    goto :goto_3

    :catch_2
    move-exception p0

    move-object p2, v3

    goto :goto_4

    :catch_3
    move-exception p0

    move-object p2, v3

    goto :goto_2

    :catch_4
    move-exception p0

    move-object p2, v3

    goto :goto_1

    :catch_5
    move-exception p0

    .line 321
    :goto_1
    :try_start_5
    invoke-virtual {p0}, Ljava/lang/reflect/InvocationTargetException;->printStackTrace()V
    :try_end_5
    .catch Ljava/lang/NoSuchMethodException; {:try_start_5 .. :try_end_5} :catch_6
    .catch Ljava/lang/IllegalAccessException; {:try_start_5 .. :try_end_5} :catch_8
    .catch Ljava/lang/IllegalArgumentException; {:try_start_5 .. :try_end_5} :catch_7
    .catch Ljava/lang/NoSuchFieldException; {:try_start_5 .. :try_end_5} :catch_9

    goto :goto_6

    :catch_6
    move-exception p0

    .line 325
    :goto_2
    :try_start_6
    invoke-virtual {p0}, Ljava/lang/NoSuchMethodException;->printStackTrace()V
    :try_end_6
    .catch Ljava/lang/IllegalAccessException; {:try_start_6 .. :try_end_6} :catch_8
    .catch Ljava/lang/IllegalArgumentException; {:try_start_6 .. :try_end_6} :catch_7
    .catch Ljava/lang/NoSuchFieldException; {:try_start_6 .. :try_end_6} :catch_9

    goto :goto_6

    :catch_7
    move-exception p0

    .line 332
    :goto_3
    :try_start_7
    invoke-virtual {p0}, Ljava/lang/IllegalArgumentException;->printStackTrace()V

    goto :goto_6

    :catch_8
    move-exception p0

    .line 329
    :goto_4
    invoke-virtual {p0}, Ljava/lang/IllegalAccessException;->printStackTrace()V
    :try_end_7
    .catch Ljava/lang/NoSuchFieldException; {:try_start_7 .. :try_end_7} :catch_9

    goto :goto_6

    :catch_9
    move-exception p0

    .line 337
    :goto_5
    invoke-virtual {p0}, Ljava/lang/NoSuchFieldException;->printStackTrace()V

    :goto_6
    return-object p2
.end method

.method private static prepareexpandFieldArray(Ljava/lang/Object;Ljava/lang/String;I)V
    .locals 5
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/NoSuchFieldException;,
            Ljava/lang/IllegalArgumentException;,
            Ljava/lang/IllegalAccessException;
        }
    .end annotation

    .line 659
    invoke-static {p0, p1}, Lcom/wrapper/proxyapplication/MultiDex;->findField(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v0

    .line 660
    invoke-virtual {v0, p0}, Ljava/lang/reflect/Field;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object p0

    check-cast p0, [Ljava/lang/Object;

    check-cast p0, [Ljava/lang/Object;

    .line 662
    invoke-virtual {p0}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v0

    invoke-virtual {v0}, Ljava/lang/Class;->getComponentType()Ljava/lang/Class;

    move-result-object v0

    array-length v1, p0

    add-int/2addr v1, p2

    invoke-static {v0, v1}, Ljava/lang/reflect/Array;->newInstance(Ljava/lang/Class;I)Ljava/lang/Object;

    move-result-object v0

    check-cast v0, [Ljava/lang/Object;

    check-cast v0, [Ljava/lang/Object;

    .line 664
    array-length v1, p0

    const/4 v2, 0x1

    sub-int/2addr v1, v2

    aget-object v1, p0, v1

    sput-object v1, Lcom/wrapper/proxyapplication/MultiDex;->baseApkDexFile:Ljava/lang/Object;

    .line 665
    sget v1, Landroid/os/Build$VERSION;->SDK_INT:I

    const/4 v3, 0x0

    const/16 v4, 0x1c

    if-ne v1, v4, :cond_0

    sget v1, Lcom/wrapper/proxyapplication/MultiDex;->hasInjected:I

    if-nez v1, :cond_0

    array-length v1, p0

    if-le v1, v2, :cond_0

    .line 666
    array-length v1, p0

    sub-int/2addr v1, v2

    invoke-static {p0, v3, v0, v3, v1}, Ljava/lang/System;->arraycopy(Ljava/lang/Object;ILjava/lang/Object;II)V

    .line 667
    array-length v1, p0

    sub-int/2addr v1, v2

    sput v1, Lcom/wrapper/proxyapplication/MultiDex;->injectDexBeginIndex:I

    .line 670
    array-length v1, p0

    sub-int/2addr v1, v2

    array-length v3, p0

    add-int/2addr p2, v3

    sub-int/2addr p2, v2

    invoke-static {p0, v1, v0, p2, v2}, Ljava/lang/System;->arraycopy(Ljava/lang/Object;ILjava/lang/Object;II)V

    goto :goto_0

    .line 673
    :cond_0
    array-length v1, p0

    invoke-static {p0, v3, v0, p2, v1}, Ljava/lang/System;->arraycopy(Ljava/lang/Object;ILjava/lang/Object;II)V

    :goto_0
    const-string p0, "dexElements"

    .line 675
    invoke-virtual {p1, p0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result p0

    if-eqz p0, :cond_1

    .line 676
    sput-object v0, Lcom/wrapper/proxyapplication/MultiDex;->injectPathListObj:[Ljava/lang/Object;

    goto :goto_1

    :cond_1
    const-string p0, "mPaths"

    .line 677
    invoke-virtual {p1, p0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result p0

    if-eqz p0, :cond_2

    .line 678
    sput-object v0, Lcom/wrapper/proxyapplication/MultiDex;->injectPathsObj:[Ljava/lang/Object;

    goto :goto_1

    :cond_2
    const-string p0, "mFiles"

    .line 679
    invoke-virtual {p1, p0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result p0

    if-eqz p0, :cond_3

    .line 680
    sput-object v0, Lcom/wrapper/proxyapplication/MultiDex;->injectFilesObj:[Ljava/lang/Object;

    goto :goto_1

    :cond_3
    const-string p0, "mZips"

    .line 681
    invoke-virtual {p1, p0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result p0

    if-eqz p0, :cond_4

    .line 682
    sput-object v0, Lcom/wrapper/proxyapplication/MultiDex;->injectZipsObj:[Ljava/lang/Object;

    goto :goto_1

    :cond_4
    const-string p0, "mDexs"

    .line 683
    invoke-virtual {p1, p0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result p0

    if-eqz p0, :cond_5

    .line 684
    sput-object v0, Lcom/wrapper/proxyapplication/MultiDex;->injectDexsObj:[Ljava/lang/Object;

    :cond_5
    :goto_1
    return-void
.end method

.method private static preparetoinstallDexes(Ljava/lang/ClassLoader;I)V
    .locals 2

    :try_start_0
    const-string v0, "pathList"

    .line 446
    invoke-static {p0, v0}, Lcom/wrapper/proxyapplication/MultiDex;->findField(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v0
    :try_end_0
    .catch Ljava/lang/NoSuchFieldException; {:try_start_0 .. :try_end_0} :catch_2

    .line 448
    :try_start_1
    invoke-virtual {v0, p0}, Ljava/lang/reflect/Field;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v0

    const-string v1, "dexElements"

    .line 449
    invoke-static {v0, v1, p1}, Lcom/wrapper/proxyapplication/MultiDex;->prepareexpandFieldArray(Ljava/lang/Object;Ljava/lang/String;I)V
    :try_end_1
    .catch Ljava/lang/IllegalArgumentException; {:try_start_1 .. :try_end_1} :catch_1
    .catch Ljava/lang/IllegalAccessException; {:try_start_1 .. :try_end_1} :catch_0
    .catch Ljava/lang/NoSuchFieldException; {:try_start_1 .. :try_end_1} :catch_2

    goto :goto_0

    :catch_0
    move-exception v0

    .line 455
    :try_start_2
    invoke-virtual {v0}, Ljava/lang/IllegalAccessException;->printStackTrace()V

    goto :goto_0

    :catch_1
    move-exception v0

    .line 452
    invoke-virtual {v0}, Ljava/lang/IllegalArgumentException;->printStackTrace()V
    :try_end_2
    .catch Ljava/lang/NoSuchFieldException; {:try_start_2 .. :try_end_2} :catch_2

    goto :goto_0

    :catch_2
    :try_start_3
    const-string v0, "path"

    .line 462
    invoke-static {p0, v0}, Lcom/wrapper/proxyapplication/MultiDex;->findField(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;
    :try_end_3
    .catch Ljava/lang/NoSuchFieldException; {:try_start_3 .. :try_end_3} :catch_5

    :try_start_4
    const-string v0, "mPaths"

    .line 464
    invoke-static {p0, v0, p1}, Lcom/wrapper/proxyapplication/MultiDex;->prepareexpandFieldArray(Ljava/lang/Object;Ljava/lang/String;I)V

    const-string v0, "mFiles"

    .line 465
    invoke-static {p0, v0, p1}, Lcom/wrapper/proxyapplication/MultiDex;->prepareexpandFieldArray(Ljava/lang/Object;Ljava/lang/String;I)V

    const-string v0, "mZips"

    .line 466
    invoke-static {p0, v0, p1}, Lcom/wrapper/proxyapplication/MultiDex;->prepareexpandFieldArray(Ljava/lang/Object;Ljava/lang/String;I)V

    const-string v0, "mDexs"

    .line 467
    invoke-static {p0, v0, p1}, Lcom/wrapper/proxyapplication/MultiDex;->prepareexpandFieldArray(Ljava/lang/Object;Ljava/lang/String;I)V
    :try_end_4
    .catch Ljava/lang/IllegalArgumentException; {:try_start_4 .. :try_end_4} :catch_4
    .catch Ljava/lang/IllegalAccessException; {:try_start_4 .. :try_end_4} :catch_3
    .catch Ljava/lang/NoSuchFieldException; {:try_start_4 .. :try_end_4} :catch_5

    return-void

    :catch_3
    move-exception p0

    .line 474
    :try_start_5
    invoke-virtual {p0}, Ljava/lang/IllegalAccessException;->printStackTrace()V

    goto :goto_0

    :catch_4
    move-exception p0

    .line 471
    invoke-virtual {p0}, Ljava/lang/IllegalArgumentException;->printStackTrace()V
    :try_end_5
    .catch Ljava/lang/NoSuchFieldException; {:try_start_5 .. :try_end_5} :catch_5

    :catch_5
    :goto_0
    return-void
.end method

.method private static splitPaths(Ljava/lang/String;)Ljava/util/ArrayList;
    .locals 5
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "(",
            "Ljava/lang/String;",
            ")",
            "Ljava/util/ArrayList<",
            "Ljava/io/File;",
            ">;"
        }
    .end annotation

    .line 256
    new-instance v0, Ljava/util/ArrayList;

    invoke-direct {v0}, Ljava/util/ArrayList;-><init>()V

    if-eqz p0, :cond_0

    .line 259
    sget-object v1, Ljava/io/File;->pathSeparator:Ljava/lang/String;

    invoke-virtual {p0, v1}, Ljava/lang/String;->split(Ljava/lang/String;)[Ljava/lang/String;

    move-result-object p0

    array-length v1, p0

    const/4 v2, 0x0

    :goto_0
    if-ge v2, v1, :cond_0

    aget-object v3, p0, v2

    .line 261
    new-instance v4, Ljava/io/File;

    invoke-direct {v4, v3}, Ljava/io/File;-><init>(Ljava/lang/String;)V

    invoke-virtual {v0, v4}, Ljava/util/ArrayList;->add(Ljava/lang/Object;)Z

    add-int/lit8 v2, v2, 0x1

    goto :goto_0

    :cond_0
    return-object v0
.end method
