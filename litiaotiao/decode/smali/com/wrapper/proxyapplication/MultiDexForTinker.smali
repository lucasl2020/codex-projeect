.class public Lcom/wrapper/proxyapplication/MultiDexForTinker;
.super Ljava/lang/Object;
.source "MultiDexForTinker.java"


# annotations
.annotation system Ldalvik/annotation/MemberClasses;
    value = {
        Lcom/wrapper/proxyapplication/MultiDexForTinker$V19;,
        Lcom/wrapper/proxyapplication/MultiDexForTinker$V4;
    }
.end annotation


# static fields
.field static final TAG:Ljava/lang/String; = "MultiDexForTinker"

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
    .locals 2

    .prologue
    const/4 v1, 0x0

    const/4 v0, 0x0

    .line 22
    sput v1, Lcom/wrapper/proxyapplication/MultiDexForTinker;->hasInjected:I

    .line 23
    sput v1, Lcom/wrapper/proxyapplication/MultiDexForTinker;->injectDexBeginIndex:I

    .line 24
    sput-object v0, Lcom/wrapper/proxyapplication/MultiDexForTinker;->injectPathListObj:[Ljava/lang/Object;

    .line 25
    sput-object v0, Lcom/wrapper/proxyapplication/MultiDexForTinker;->injectPathsObj:[Ljava/lang/Object;

    .line 26
    sput-object v0, Lcom/wrapper/proxyapplication/MultiDexForTinker;->injectFilesObj:[Ljava/lang/Object;

    .line 27
    sput-object v0, Lcom/wrapper/proxyapplication/MultiDexForTinker;->injectZipsObj:[Ljava/lang/Object;

    .line 28
    sput-object v0, Lcom/wrapper/proxyapplication/MultiDexForTinker;->injectDexsObj:[Ljava/lang/Object;

    .line 29
    sput-object v0, Lcom/wrapper/proxyapplication/MultiDexForTinker;->dexElementsSuppressedExceptions:[Ljava/io/IOException;

    return-void
.end method

.method private constructor <init>()V
    .locals 0

    .prologue
    .line 30
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    return-void
.end method

.method static synthetic access$0(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;
    .locals 1
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/NoSuchFieldException;
        }
    .end annotation

    .prologue
    .line 563
    invoke-static {p0, p1}, Lcom/wrapper/proxyapplication/MultiDexForTinker;->findField(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v0

    return-object v0
.end method

.method static synthetic access$1(Ljava/lang/Object;Ljava/lang/String;[Ljava/lang/Object;)V
    .locals 0
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/NoSuchFieldException;,
            Ljava/lang/IllegalArgumentException;,
            Ljava/lang/IllegalAccessException;
        }
    .end annotation

    .prologue
    .line 643
    invoke-static {p0, p1, p2}, Lcom/wrapper/proxyapplication/MultiDexForTinker;->expandFieldArray(Ljava/lang/Object;Ljava/lang/String;[Ljava/lang/Object;)V

    return-void
.end method

.method static synthetic access$2(Ljava/lang/Object;Ljava/lang/String;[Ljava/lang/Object;I)V
    .locals 0
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/NoSuchFieldException;,
            Ljava/lang/IllegalArgumentException;,
            Ljava/lang/IllegalAccessException;
        }
    .end annotation

    .prologue
    .line 669
    invoke-static {p0, p1, p2, p3}, Lcom/wrapper/proxyapplication/MultiDexForTinker;->expandFieldArray(Ljava/lang/Object;Ljava/lang/String;[Ljava/lang/Object;I)V

    return-void
.end method

.method static synthetic access$3(Ljava/lang/Object;Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;
    .locals 1
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/NoSuchMethodException;
        }
    .end annotation

    .prologue
    .line 614
    invoke-static {p0, p1, p2}, Lcom/wrapper/proxyapplication/MultiDexForTinker;->findMethod(Ljava/lang/Object;Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v0

    return-object v0
.end method

.method static synthetic access$4(Ljava/lang/String;)Ljava/lang/String;
    .locals 1

    .prologue
    .line 230
    invoke-static {p0}, Lcom/wrapper/proxyapplication/MultiDexForTinker;->getprefixname(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v0

    return-object v0
.end method

.method private static expandFieldArray(Ljava/lang/Object;Ljava/lang/String;[Ljava/lang/Object;)V
    .locals 7
    .param p0, "instance"    # Ljava/lang/Object;
    .param p1, "fieldName"    # Ljava/lang/String;
    .param p2, "extraElements"    # [Ljava/lang/Object;
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/NoSuchFieldException;,
            Ljava/lang/IllegalArgumentException;,
            Ljava/lang/IllegalAccessException;
        }
    .end annotation

    .prologue
    const/4 v6, 0x0

    .line 646
    invoke-static {p0, p1}, Lcom/wrapper/proxyapplication/MultiDexForTinker;->findField(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v1

    .line 647
    .local v1, "jlrField":Ljava/lang/reflect/Field;
    invoke-virtual {v1, p0}, Ljava/lang/reflect/Field;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v2

    check-cast v2, [Ljava/lang/Object;

    .line 650
    .local v2, "original":[Ljava/lang/Object;
    invoke-virtual {v2}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v3

    invoke-virtual {v3}, Ljava/lang/Class;->getComponentType()Ljava/lang/Class;

    move-result-object v3

    array-length v4, v2

    array-length v5, p2

    add-int/2addr v4, v5

    .line 649
    invoke-static {v3, v4}, Ljava/lang/reflect/Array;->newInstance(Ljava/lang/Class;I)Ljava/lang/Object;

    move-result-object v0

    check-cast v0, [Ljava/lang/Object;

    .line 664
    .local v0, "combined":[Ljava/lang/Object;
    array-length v3, v2

    invoke-static {v2, v6, v0, v6, v3}, Ljava/lang/System;->arraycopy(Ljava/lang/Object;ILjava/lang/Object;II)V

    .line 665
    array-length v3, v2

    array-length v4, p2

    invoke-static {p2, v6, v0, v3, v4}, Ljava/lang/System;->arraycopy(Ljava/lang/Object;ILjava/lang/Object;II)V

    .line 666
    invoke-virtual {v1, p0, v0}, Ljava/lang/reflect/Field;->set(Ljava/lang/Object;Ljava/lang/Object;)V

    .line 667
    return-void
.end method

.method private static expandFieldArray(Ljava/lang/Object;Ljava/lang/String;[Ljava/lang/Object;I)V
    .locals 5
    .param p0, "instance"    # Ljava/lang/Object;
    .param p1, "fieldName"    # Ljava/lang/String;
    .param p2, "extraElements"    # [Ljava/lang/Object;
    .param p3, "index"    # I
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/NoSuchFieldException;,
            Ljava/lang/IllegalArgumentException;,
            Ljava/lang/IllegalAccessException;
        }
    .end annotation

    .prologue
    const/4 v4, 0x0

    .line 672
    invoke-static {p0, p1}, Lcom/wrapper/proxyapplication/MultiDexForTinker;->findField(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v0

    .line 674
    .local v0, "jlrField":Ljava/lang/reflect/Field;
    const-string v1, "dexElements"

    invoke-virtual {p1, v1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v1

    if-eqz v1, :cond_1

    .line 675
    sget-object v1, Lcom/wrapper/proxyapplication/MultiDexForTinker;->injectPathListObj:[Ljava/lang/Object;

    sget v2, Lcom/wrapper/proxyapplication/MultiDexForTinker;->injectDexBeginIndex:I

    add-int/2addr v2, p3

    array-length v3, p2

    invoke-static {p2, v4, v1, v2, v3}, Ljava/lang/System;->arraycopy(Ljava/lang/Object;ILjava/lang/Object;II)V

    .line 685
    :cond_0
    :goto_0
    return-void

    .line 676
    :cond_1
    const-string v1, "mPaths"

    invoke-virtual {p1, v1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v1

    if-eqz v1, :cond_2

    .line 677
    sget-object v1, Lcom/wrapper/proxyapplication/MultiDexForTinker;->injectPathsObj:[Ljava/lang/Object;

    sget v2, Lcom/wrapper/proxyapplication/MultiDexForTinker;->injectDexBeginIndex:I

    add-int/2addr v2, p3

    array-length v3, p2

    invoke-static {p2, v4, v1, v2, v3}, Ljava/lang/System;->arraycopy(Ljava/lang/Object;ILjava/lang/Object;II)V

    goto :goto_0

    .line 678
    :cond_2
    const-string v1, "mFiles"

    invoke-virtual {p1, v1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v1

    if-eqz v1, :cond_3

    .line 679
    sget-object v1, Lcom/wrapper/proxyapplication/MultiDexForTinker;->injectFilesObj:[Ljava/lang/Object;

    sget v2, Lcom/wrapper/proxyapplication/MultiDexForTinker;->injectDexBeginIndex:I

    add-int/2addr v2, p3

    array-length v3, p2

    invoke-static {p2, v4, v1, v2, v3}, Ljava/lang/System;->arraycopy(Ljava/lang/Object;ILjava/lang/Object;II)V

    goto :goto_0

    .line 680
    :cond_3
    const-string v1, "mDexs"

    invoke-virtual {p1, v1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v1

    if-eqz v1, :cond_4

    .line 681
    sget-object v1, Lcom/wrapper/proxyapplication/MultiDexForTinker;->injectDexsObj:[Ljava/lang/Object;

    sget v2, Lcom/wrapper/proxyapplication/MultiDexForTinker;->injectDexBeginIndex:I

    add-int/2addr v2, p3

    array-length v3, p2

    invoke-static {p2, v4, v1, v2, v3}, Ljava/lang/System;->arraycopy(Ljava/lang/Object;ILjava/lang/Object;II)V

    goto :goto_0

    .line 682
    :cond_4
    const-string v1, "mZips"

    invoke-virtual {p1, v1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v1

    if-eqz v1, :cond_0

    .line 683
    sget-object v1, Lcom/wrapper/proxyapplication/MultiDexForTinker;->injectZipsObj:[Ljava/lang/Object;

    sget v2, Lcom/wrapper/proxyapplication/MultiDexForTinker;->injectDexBeginIndex:I

    add-int/2addr v2, p3

    array-length v3, p2

    invoke-static {p2, v4, v1, v2, v3}, Ljava/lang/System;->arraycopy(Ljava/lang/Object;ILjava/lang/Object;II)V

    goto :goto_0
.end method

.method private static findField(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;
    .locals 5
    .param p0, "instance"    # Ljava/lang/Object;
    .param p1, "name"    # Ljava/lang/String;
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/NoSuchFieldException;
        }
    .end annotation

    .prologue
    .line 564
    invoke-virtual {p0}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v0

    .local v0, "clazz":Ljava/lang/Class;, "Ljava/lang/Class<*>;"
    :goto_0
    if-nez v0, :cond_0

    .line 579
    new-instance v2, Ljava/lang/NoSuchFieldException;

    new-instance v3, Ljava/lang/StringBuilder;

    const-string v4, "Field "

    invoke-direct {v3, v4}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    invoke-virtual {v3, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v3

    const-string v4, " not found in "

    invoke-virtual {v3, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v3

    invoke-virtual {p0}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v4

    invoke-virtual {v3, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;

    move-result-object v3

    invoke-virtual {v3}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v3

    invoke-direct {v2, v3}, Ljava/lang/NoSuchFieldException;-><init>(Ljava/lang/String;)V

    throw v2

    .line 566
    :cond_0
    :try_start_0
    invoke-virtual {v0, p1}, Ljava/lang/Class;->getDeclaredField(Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v1

    .line 569
    .local v1, "field":Ljava/lang/reflect/Field;
    invoke-virtual {v1}, Ljava/lang/reflect/Field;->isAccessible()Z

    move-result v2

    if-nez v2, :cond_1

    .line 570
    const/4 v2, 0x1

    invoke-virtual {v1, v2}, Ljava/lang/reflect/Field;->setAccessible(Z)V
    :try_end_0
    .catch Ljava/lang/NoSuchFieldException; {:try_start_0 .. :try_end_0} :catch_0

    .line 573
    :cond_1
    return-object v1

    .line 574
    .end local v1    # "field":Ljava/lang/reflect/Field;
    :catch_0
    move-exception v2

    .line 564
    invoke-virtual {v0}, Ljava/lang/Class;->getSuperclass()Ljava/lang/Class;

    move-result-object v0

    goto :goto_0
.end method

.method private static varargs findMethod(Ljava/lang/Object;Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;
    .locals 5
    .param p0, "instance"    # Ljava/lang/Object;
    .param p1, "name"    # Ljava/lang/String;
    .param p2, "parameterTypes"    # [Ljava/lang/Class;
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "(",
            "Ljava/lang/Object;",
            "Ljava/lang/String;",
            "[",
            "Ljava/lang/Class",
            "<*>;)",
            "Ljava/lang/reflect/Method;"
        }
    .end annotation

    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/NoSuchMethodException;
        }
    .end annotation

    .prologue
    .line 616
    invoke-virtual {p0}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v0

    .local v0, "clazz":Ljava/lang/Class;, "Ljava/lang/Class<*>;"
    :goto_0
    if-nez v0, :cond_0

    .line 631
    new-instance v2, Ljava/lang/NoSuchMethodException;

    new-instance v3, Ljava/lang/StringBuilder;

    const-string v4, "Method "

    invoke-direct {v3, v4}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    invoke-virtual {v3, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v3

    const-string v4, " with parameters "

    invoke-virtual {v3, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v3

    .line 632
    invoke-static {p2}, Ljava/util/Arrays;->asList([Ljava/lang/Object;)Ljava/util/List;

    move-result-object v4

    invoke-virtual {v3, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;

    move-result-object v3

    const-string v4, " not found in "

    invoke-virtual {v3, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v3

    invoke-virtual {p0}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v4

    invoke-virtual {v3, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;

    move-result-object v3

    invoke-virtual {v3}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v3

    .line 631
    invoke-direct {v2, v3}, Ljava/lang/NoSuchMethodException;-><init>(Ljava/lang/String;)V

    throw v2

    .line 618
    :cond_0
    :try_start_0
    invoke-virtual {v0, p1, p2}, Ljava/lang/Class;->getDeclaredMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v1

    .line 621
    .local v1, "method":Ljava/lang/reflect/Method;
    invoke-virtual {v1}, Ljava/lang/reflect/Method;->isAccessible()Z

    move-result v2

    if-nez v2, :cond_1

    .line 622
    const/4 v2, 0x1

    invoke-virtual {v1, v2}, Ljava/lang/reflect/Method;->setAccessible(Z)V
    :try_end_0
    .catch Ljava/lang/NoSuchMethodException; {:try_start_0 .. :try_end_0} :catch_0

    .line 625
    :cond_1
    return-object v1

    .line 626
    .end local v1    # "method":Ljava/lang/reflect/Method;
    :catch_0
    move-exception v2

    .line 616
    invoke-virtual {v0}, Ljava/lang/Class;->getSuperclass()Ljava/lang/Class;

    move-result-object v0

    goto :goto_0
.end method

.method private static varargs findMethodinClazz(Ljava/lang/Class;Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;
    .locals 4
    .param p1, "name"    # Ljava/lang/String;
    .param p2, "parameterTypes"    # [Ljava/lang/Class;
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "(",
            "Ljava/lang/Class",
            "<*>;",
            "Ljava/lang/String;",
            "[",
            "Ljava/lang/Class",
            "<*>;)",
            "Ljava/lang/reflect/Method;"
        }
    .end annotation

    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/NoSuchMethodException;
        }
    .end annotation

    .prologue
    .line 586
    .local p0, "clazz":Ljava/lang/Class;, "Ljava/lang/Class<*>;"
    :goto_0
    if-nez p0, :cond_0

    .line 601
    new-instance v1, Ljava/lang/NoSuchMethodException;

    new-instance v2, Ljava/lang/StringBuilder;

    const-string v3, "Method "

    invoke-direct {v2, v3}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    invoke-virtual {v2, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v2

    const-string v3, " with parameters "

    invoke-virtual {v2, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v2

    .line 602
    invoke-static {p2}, Ljava/util/Arrays;->asList([Ljava/lang/Object;)Ljava/util/List;

    move-result-object v3

    invoke-virtual {v2, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;

    move-result-object v2

    const-string v3, " not found in "

    invoke-virtual {v2, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v2

    invoke-virtual {v2, p0}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;

    move-result-object v2

    invoke-virtual {v2}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v2

    .line 601
    invoke-direct {v1, v2}, Ljava/lang/NoSuchMethodException;-><init>(Ljava/lang/String;)V

    throw v1

    .line 588
    :cond_0
    :try_start_0
    invoke-virtual {p0, p1, p2}, Ljava/lang/Class;->getDeclaredMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v0

    .line 591
    .local v0, "method":Ljava/lang/reflect/Method;
    invoke-virtual {v0}, Ljava/lang/reflect/Method;->isAccessible()Z

    move-result v1

    if-nez v1, :cond_1

    .line 592
    const/4 v1, 0x1

    invoke-virtual {v0, v1}, Ljava/lang/reflect/Method;->setAccessible(Z)V
    :try_end_0
    .catch Ljava/lang/NoSuchMethodException; {:try_start_0 .. :try_end_0} :catch_0

    .line 595
    :cond_1
    return-object v0

    .line 596
    .end local v0    # "method":Ljava/lang/reflect/Method;
    :catch_0
    move-exception v1

    .line 586
    invoke-virtual {p0}, Ljava/lang/Class;->getSuperclass()Ljava/lang/Class;

    move-result-object p0

    goto :goto_0
.end method

.method private static finishinstallDexes(Ljava/lang/ClassLoader;)V
    .locals 15
    .param p0, "loader"    # Ljava/lang/ClassLoader;

    .prologue
    .line 488
    const/4 v10, 0x0

    .line 490
    .local v10, "pathListField":Ljava/lang/reflect/Field;
    :try_start_0
    const-string v13, "pathList"

    invoke-static {p0, v13}, Lcom/wrapper/proxyapplication/MultiDexForTinker;->findField(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;
    :try_end_0
    .catch Ljava/lang/NoSuchFieldException; {:try_start_0 .. :try_end_0} :catch_1

    move-result-object v10

    .line 492
    :try_start_1
    invoke-virtual {v10, p0}, Ljava/lang/reflect/Field;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v1

    .line 493
    .local v1, "dexPathList":Ljava/lang/Object;
    const-string v13, "dexElements"

    invoke-static {v1, v13}, Lcom/wrapper/proxyapplication/MultiDexForTinker;->findField(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v8

    .line 495
    .local v8, "jlrField":Ljava/lang/reflect/Field;
    sget-object v13, Lcom/wrapper/proxyapplication/MultiDexForTinker;->injectPathListObj:[Ljava/lang/Object;

    invoke-virtual {v8, v1, v13}, Ljava/lang/reflect/Field;->set(Ljava/lang/Object;Ljava/lang/Object;)V

    .line 496
    sget-object v13, Lcom/wrapper/proxyapplication/MultiDexForTinker;->dexElementsSuppressedExceptions:[Ljava/io/IOException;

    if-eqz v13, :cond_0

    .line 499
    const-string v13, "dexElementsSuppressedExceptions"

    invoke-static {v1, v13}, Lcom/wrapper/proxyapplication/MultiDexForTinker;->findField(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v11

    .line 500
    .local v11, "suppressedExceptionsField":Ljava/lang/reflect/Field;
    sget-object v13, Lcom/wrapper/proxyapplication/MultiDexForTinker;->dexElementsSuppressedExceptions:[Ljava/io/IOException;

    invoke-virtual {v11, v1, v13}, Ljava/lang/reflect/Field;->set(Ljava/lang/Object;Ljava/lang/Object;)V
    :try_end_1
    .catch Ljava/lang/IllegalArgumentException; {:try_start_1 .. :try_end_1} :catch_0
    .catch Ljava/lang/IllegalAccessException; {:try_start_1 .. :try_end_1} :catch_4
    .catch Ljava/lang/NoSuchFieldException; {:try_start_1 .. :try_end_1} :catch_1

    .line 550
    .end local v1    # "dexPathList":Ljava/lang/Object;
    .end local v8    # "jlrField":Ljava/lang/reflect/Field;
    .end local v11    # "suppressedExceptionsField":Ljava/lang/reflect/Field;
    :cond_0
    :goto_0
    return-void

    .line 505
    :catch_0
    move-exception v6

    .line 507
    .local v6, "e5":Ljava/lang/IllegalArgumentException;
    :try_start_2
    invoke-virtual {v6}, Ljava/lang/IllegalArgumentException;->printStackTrace()V
    :try_end_2
    .catch Ljava/lang/NoSuchFieldException; {:try_start_2 .. :try_end_2} :catch_1

    goto :goto_0

    .line 513
    .end local v6    # "e5":Ljava/lang/IllegalArgumentException;
    :catch_1
    move-exception v2

    .line 517
    .local v2, "e":Ljava/lang/NoSuchFieldException;
    :try_start_3
    const-string v13, "path"

    invoke-static {p0, v13}, Lcom/wrapper/proxyapplication/MultiDexForTinker;->findField(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;
    :try_end_3
    .catch Ljava/lang/NoSuchFieldException; {:try_start_3 .. :try_end_3} :catch_3

    move-result-object v10

    .line 519
    :try_start_4
    invoke-virtual {v10, p0}, Ljava/lang/reflect/Field;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v1

    .line 520
    .restart local v1    # "dexPathList":Ljava/lang/Object;
    const-string v13, "mPaths"

    invoke-static {v1, v13}, Lcom/wrapper/proxyapplication/MultiDexForTinker;->findField(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v9

    .line 522
    .local v9, "pathField":Ljava/lang/reflect/Field;
    sget-object v13, Lcom/wrapper/proxyapplication/MultiDexForTinker;->injectPathsObj:[Ljava/lang/Object;

    invoke-virtual {v9, v1, v13}, Ljava/lang/reflect/Field;->set(Ljava/lang/Object;Ljava/lang/Object;)V

    .line 524
    const-string v13, "mFiles"

    invoke-static {v1, v13}, Lcom/wrapper/proxyapplication/MultiDexForTinker;->findField(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v7

    .line 526
    .local v7, "fileField":Ljava/lang/reflect/Field;
    sget-object v13, Lcom/wrapper/proxyapplication/MultiDexForTinker;->injectFilesObj:[Ljava/lang/Object;

    invoke-virtual {v7, v1, v13}, Ljava/lang/reflect/Field;->set(Ljava/lang/Object;Ljava/lang/Object;)V

    .line 528
    const-string v13, "mZips"

    invoke-static {v1, v13}, Lcom/wrapper/proxyapplication/MultiDexForTinker;->findField(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v12

    .line 530
    .local v12, "zipField":Ljava/lang/reflect/Field;
    sget-object v13, Lcom/wrapper/proxyapplication/MultiDexForTinker;->injectZipsObj:[Ljava/lang/Object;

    invoke-virtual {v12, v1, v13}, Ljava/lang/reflect/Field;->set(Ljava/lang/Object;Ljava/lang/Object;)V

    .line 532
    const-string v13, "mDexs"

    invoke-static {v1, v13}, Lcom/wrapper/proxyapplication/MultiDexForTinker;->findField(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v0

    .line 534
    .local v0, "dexField":Ljava/lang/reflect/Field;
    sget-object v13, Lcom/wrapper/proxyapplication/MultiDexForTinker;->injectDexsObj:[Ljava/lang/Object;

    invoke-virtual {v0, v1, v13}, Ljava/lang/reflect/Field;->set(Ljava/lang/Object;Ljava/lang/Object;)V
    :try_end_4
    .catch Ljava/lang/IllegalArgumentException; {:try_start_4 .. :try_end_4} :catch_2
    .catch Ljava/lang/IllegalAccessException; {:try_start_4 .. :try_end_4} :catch_5
    .catch Ljava/lang/NoSuchFieldException; {:try_start_4 .. :try_end_4} :catch_3

    goto :goto_0

    .line 536
    .end local v0    # "dexField":Ljava/lang/reflect/Field;
    .end local v1    # "dexPathList":Ljava/lang/Object;
    .end local v7    # "fileField":Ljava/lang/reflect/Field;
    .end local v9    # "pathField":Ljava/lang/reflect/Field;
    .end local v12    # "zipField":Ljava/lang/reflect/Field;
    :catch_2
    move-exception v3

    .line 538
    .local v3, "e1":Ljava/lang/IllegalArgumentException;
    :try_start_5
    invoke-virtual {v3}, Ljava/lang/IllegalArgumentException;->printStackTrace()V
    :try_end_5
    .catch Ljava/lang/NoSuchFieldException; {:try_start_5 .. :try_end_5} :catch_3

    goto :goto_0

    .line 543
    .end local v3    # "e1":Ljava/lang/IllegalArgumentException;
    :catch_3
    move-exception v5

    .line 545
    .local v5, "e4":Ljava/lang/NoSuchFieldException;
    goto :goto_0

    .line 508
    .end local v2    # "e":Ljava/lang/NoSuchFieldException;
    .end local v5    # "e4":Ljava/lang/NoSuchFieldException;
    :catch_4
    move-exception v3

    .line 510
    .local v3, "e1":Ljava/lang/IllegalAccessException;
    :try_start_6
    invoke-virtual {v3}, Ljava/lang/IllegalAccessException;->printStackTrace()V
    :try_end_6
    .catch Ljava/lang/NoSuchFieldException; {:try_start_6 .. :try_end_6} :catch_1

    goto :goto_0

    .line 539
    .end local v3    # "e1":Ljava/lang/IllegalAccessException;
    .restart local v2    # "e":Ljava/lang/NoSuchFieldException;
    :catch_5
    move-exception v4

    .line 541
    .local v4, "e2":Ljava/lang/IllegalAccessException;
    :try_start_7
    invoke-virtual {v4}, Ljava/lang/IllegalAccessException;->printStackTrace()V
    :try_end_7
    .catch Ljava/lang/NoSuchFieldException; {:try_start_7 .. :try_end_7} :catch_3

    goto :goto_0
.end method

.method private static getprefixname(Ljava/lang/String;)Ljava/lang/String;
    .locals 5
    .param p0, "fullname"    # Ljava/lang/String;

    .prologue
    .line 233
    const/4 v0, 0x0

    .line 234
    .local v0, "filename":Ljava/lang/String;
    const/4 v1, 0x0

    .line 236
    .local v1, "prefixname":Ljava/lang/String;
    const-string v4, "/"

    invoke-virtual {p0, v4}, Ljava/lang/String;->lastIndexOf(Ljava/lang/String;)I

    move-result v2

    .line 237
    .local v2, "preindex":I
    if-ltz v2, :cond_0

    .line 240
    add-int/lit8 v4, v2, 0x1

    invoke-virtual {p0, v4}, Ljava/lang/String;->substring(I)Ljava/lang/String;

    move-result-object v0

    .line 248
    :goto_0
    const-string v4, "."

    invoke-virtual {v0, v4}, Ljava/lang/String;->lastIndexOf(Ljava/lang/String;)I

    move-result v3

    .line 249
    .local v3, "sufindex":I
    if-ltz v3, :cond_1

    .line 251
    const/4 v4, 0x0

    invoke-virtual {v0, v4, v3}, Ljava/lang/String;->substring(II)Ljava/lang/String;

    move-result-object v1

    .line 258
    :goto_1
    return-object v1

    .line 245
    .end local v3    # "sufindex":I
    :cond_0
    move-object v0, p0

    goto :goto_0

    .line 256
    .restart local v3    # "sufindex":I
    :cond_1
    move-object v1, v0

    goto :goto_1
.end method

.method private static installDexes(Ljava/lang/ClassLoader;Ljava/lang/String;Ljava/lang/String;)Ljava/util/ArrayList;
    .locals 11
    .param p0, "loader"    # Ljava/lang/ClassLoader;
    .param p1, "jarordexpathlist"    # Ljava/lang/String;
    .param p2, "Odexpath"    # Ljava/lang/String;
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "(",
            "Ljava/lang/ClassLoader;",
            "Ljava/lang/String;",
            "Ljava/lang/String;",
            ")",
            "Ljava/util/ArrayList",
            "<",
            "Ljava/lang/Object;",
            ">;"
        }
    .end annotation

    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;
        }
    .end annotation

    .prologue
    .line 321
    const/4 v8, 0x0

    .line 322
    .local v8, "pathListField":Ljava/lang/reflect/Field;
    invoke-static {p1}, Lcom/wrapper/proxyapplication/MultiDexForTinker;->splitPaths(Ljava/lang/String;)Ljava/util/ArrayList;

    move-result-object v7

    .line 323
    .local v7, "jarordexfilelist":Ljava/util/ArrayList;, "Ljava/util/ArrayList<Ljava/io/File;>;"
    new-instance v0, Ljava/io/File;

    invoke-direct {v0, p2}, Ljava/io/File;-><init>(Ljava/lang/String;)V

    .line 325
    .local v0, "Odexdir":Ljava/io/File;
    :try_start_0
    const-string v9, "pathList"

    invoke-static {p0, v9}, Lcom/wrapper/proxyapplication/MultiDexForTinker;->findField(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;
    :try_end_0
    .catch Ljava/lang/NoSuchFieldException; {:try_start_0 .. :try_end_0} :catch_2

    move-result-object v8

    .line 328
    :try_start_1
    invoke-static {p0, v8, v7, v0}, Lcom/wrapper/proxyapplication/MultiDexForTinker$V19;->access$0(Ljava/lang/ClassLoader;Ljava/lang/reflect/Field;Ljava/util/List;Ljava/io/File;)Ljava/util/ArrayList;
    :try_end_1
    .catch Ljava/lang/IllegalArgumentException; {:try_start_1 .. :try_end_1} :catch_0
    .catch Ljava/lang/IllegalAccessException; {:try_start_1 .. :try_end_1} :catch_1
    .catch Ljava/lang/reflect/InvocationTargetException; {:try_start_1 .. :try_end_1} :catch_3
    .catch Ljava/lang/NoSuchMethodException; {:try_start_1 .. :try_end_1} :catch_4
    .catch Ljava/io/IOException; {:try_start_1 .. :try_end_1} :catch_5
    .catch Ljava/lang/NoSuchFieldException; {:try_start_1 .. :try_end_1} :catch_2

    move-result-object v9

    .line 376
    :goto_0
    return-object v9

    .line 331
    :catch_0
    move-exception v6

    .line 333
    .local v6, "e5":Ljava/lang/IllegalArgumentException;
    :try_start_2
    invoke-virtual {v6}, Ljava/lang/IllegalArgumentException;->printStackTrace()V

    .line 376
    .end local v6    # "e5":Ljava/lang/IllegalArgumentException;
    :goto_1
    const/4 v9, 0x0

    goto :goto_0

    .line 334
    :catch_1
    move-exception v2

    .line 336
    .local v2, "e1":Ljava/lang/IllegalAccessException;
    invoke-virtual {v2}, Ljava/lang/IllegalAccessException;->printStackTrace()V
    :try_end_2
    .catch Ljava/lang/NoSuchFieldException; {:try_start_2 .. :try_end_2} :catch_2

    goto :goto_1

    .line 350
    .end local v2    # "e1":Ljava/lang/IllegalAccessException;
    :catch_2
    move-exception v1

    .line 354
    .local v1, "e":Ljava/lang/NoSuchFieldException;
    :try_start_3
    const-string v9, "path"

    invoke-static {p0, v9}, Lcom/wrapper/proxyapplication/MultiDexForTinker;->findField(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;
    :try_end_3
    .catch Ljava/lang/NoSuchFieldException; {:try_start_3 .. :try_end_3} :catch_7

    move-result-object v8

    .line 356
    :try_start_4
    invoke-static {p0, v8, v7, v0}, Lcom/wrapper/proxyapplication/MultiDexForTinker$V4;->access$0(Ljava/lang/ClassLoader;Ljava/lang/reflect/Field;Ljava/util/List;Ljava/io/File;)Ljava/util/ArrayList;
    :try_end_4
    .catch Ljava/lang/IllegalArgumentException; {:try_start_4 .. :try_end_4} :catch_6
    .catch Ljava/lang/IllegalAccessException; {:try_start_4 .. :try_end_4} :catch_8
    .catch Ljava/io/IOException; {:try_start_4 .. :try_end_4} :catch_9
    .catch Ljava/lang/NoSuchFieldException; {:try_start_4 .. :try_end_4} :catch_7

    move-result-object v9

    goto :goto_0

    .line 337
    .end local v1    # "e":Ljava/lang/NoSuchFieldException;
    :catch_3
    move-exception v3

    .line 339
    .local v3, "e2":Ljava/lang/reflect/InvocationTargetException;
    :try_start_5
    invoke-virtual {v3}, Ljava/lang/reflect/InvocationTargetException;->printStackTrace()V

    goto :goto_1

    .line 340
    .end local v3    # "e2":Ljava/lang/reflect/InvocationTargetException;
    :catch_4
    move-exception v4

    .line 342
    .local v4, "e3":Ljava/lang/NoSuchMethodException;
    invoke-virtual {v4}, Ljava/lang/NoSuchMethodException;->printStackTrace()V

    goto :goto_1

    .line 344
    .end local v4    # "e3":Ljava/lang/NoSuchMethodException;
    :catch_5
    move-exception v5

    .line 347
    .local v5, "e4":Ljava/io/IOException;
    new-instance v9, Ljava/io/IOException;

    const-string v10, "v19,load dex fail"

    invoke-direct {v9, v10}, Ljava/io/IOException;-><init>(Ljava/lang/String;)V

    throw v9
    :try_end_5
    .catch Ljava/lang/NoSuchFieldException; {:try_start_5 .. :try_end_5} :catch_2

    .line 358
    .end local v5    # "e4":Ljava/io/IOException;
    .restart local v1    # "e":Ljava/lang/NoSuchFieldException;
    :catch_6
    move-exception v2

    .line 360
    .local v2, "e1":Ljava/lang/IllegalArgumentException;
    :try_start_6
    invoke-virtual {v2}, Ljava/lang/IllegalArgumentException;->printStackTrace()V
    :try_end_6
    .catch Ljava/lang/NoSuchFieldException; {:try_start_6 .. :try_end_6} :catch_7

    goto :goto_1

    .line 369
    .end local v2    # "e1":Ljava/lang/IllegalArgumentException;
    :catch_7
    move-exception v5

    .line 371
    .local v5, "e4":Ljava/lang/NoSuchFieldException;
    goto :goto_1

    .line 361
    .end local v5    # "e4":Ljava/lang/NoSuchFieldException;
    :catch_8
    move-exception v3

    .line 363
    .local v3, "e2":Ljava/lang/IllegalAccessException;
    :try_start_7
    invoke-virtual {v3}, Ljava/lang/IllegalAccessException;->printStackTrace()V

    goto :goto_1

    .line 364
    .end local v3    # "e2":Ljava/lang/IllegalAccessException;
    :catch_9
    move-exception v4

    .line 367
    .local v4, "e3":Ljava/io/IOException;
    new-instance v9, Ljava/io/IOException;

    const-string v10, "v4, load dex fail"

    invoke-direct {v9, v10}, Ljava/io/IOException;-><init>(Ljava/lang/String;)V

    throw v9
    :try_end_7
    .catch Ljava/lang/NoSuchFieldException; {:try_start_7 .. :try_end_7} :catch_7
.end method

.method private static installDexes(Ljava/lang/ClassLoader;Ljava/lang/String;Ljava/lang/String;I)Ljava/util/ArrayList;
    .locals 11
    .param p0, "loader"    # Ljava/lang/ClassLoader;
    .param p1, "jarordexpathlist"    # Ljava/lang/String;
    .param p2, "Odexpath"    # Ljava/lang/String;
    .param p3, "index"    # I
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "(",
            "Ljava/lang/ClassLoader;",
            "Ljava/lang/String;",
            "Ljava/lang/String;",
            "I)",
            "Ljava/util/ArrayList",
            "<",
            "Ljava/lang/Object;",
            ">;"
        }
    .end annotation

    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;
        }
    .end annotation

    .prologue
    .line 381
    const/4 v8, 0x0

    .line 382
    .local v8, "pathListField":Ljava/lang/reflect/Field;
    invoke-static {p1}, Lcom/wrapper/proxyapplication/MultiDexForTinker;->splitPaths(Ljava/lang/String;)Ljava/util/ArrayList;

    move-result-object v7

    .line 383
    .local v7, "jarordexfilelist":Ljava/util/ArrayList;, "Ljava/util/ArrayList<Ljava/io/File;>;"
    new-instance v0, Ljava/io/File;

    invoke-direct {v0, p2}, Ljava/io/File;-><init>(Ljava/lang/String;)V

    .line 385
    .local v0, "Odexdir":Ljava/io/File;
    :try_start_0
    const-string v9, "pathList"

    invoke-static {p0, v9}, Lcom/wrapper/proxyapplication/MultiDexForTinker;->findField(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;
    :try_end_0
    .catch Ljava/lang/NoSuchFieldException; {:try_start_0 .. :try_end_0} :catch_2

    move-result-object v8

    .line 388
    :try_start_1
    invoke-static {p0, v8, v7, v0, p3}, Lcom/wrapper/proxyapplication/MultiDexForTinker$V19;->access$1(Ljava/lang/ClassLoader;Ljava/lang/reflect/Field;Ljava/util/List;Ljava/io/File;I)Ljava/util/ArrayList;
    :try_end_1
    .catch Ljava/lang/IllegalArgumentException; {:try_start_1 .. :try_end_1} :catch_0
    .catch Ljava/lang/IllegalAccessException; {:try_start_1 .. :try_end_1} :catch_1
    .catch Ljava/lang/reflect/InvocationTargetException; {:try_start_1 .. :try_end_1} :catch_3
    .catch Ljava/lang/NoSuchMethodException; {:try_start_1 .. :try_end_1} :catch_4
    .catch Ljava/io/IOException; {:try_start_1 .. :try_end_1} :catch_5
    .catch Ljava/lang/NoSuchFieldException; {:try_start_1 .. :try_end_1} :catch_2

    move-result-object v9

    .line 436
    :goto_0
    return-object v9

    .line 391
    :catch_0
    move-exception v6

    .line 393
    .local v6, "e5":Ljava/lang/IllegalArgumentException;
    :try_start_2
    invoke-virtual {v6}, Ljava/lang/IllegalArgumentException;->printStackTrace()V

    .line 436
    .end local v6    # "e5":Ljava/lang/IllegalArgumentException;
    :goto_1
    const/4 v9, 0x0

    goto :goto_0

    .line 394
    :catch_1
    move-exception v2

    .line 396
    .local v2, "e1":Ljava/lang/IllegalAccessException;
    invoke-virtual {v2}, Ljava/lang/IllegalAccessException;->printStackTrace()V
    :try_end_2
    .catch Ljava/lang/NoSuchFieldException; {:try_start_2 .. :try_end_2} :catch_2

    goto :goto_1

    .line 410
    .end local v2    # "e1":Ljava/lang/IllegalAccessException;
    :catch_2
    move-exception v1

    .line 414
    .local v1, "e":Ljava/lang/NoSuchFieldException;
    :try_start_3
    const-string v9, "path"

    invoke-static {p0, v9}, Lcom/wrapper/proxyapplication/MultiDexForTinker;->findField(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;
    :try_end_3
    .catch Ljava/lang/NoSuchFieldException; {:try_start_3 .. :try_end_3} :catch_7

    move-result-object v8

    .line 416
    :try_start_4
    invoke-static {p0, v8, v7, v0, p3}, Lcom/wrapper/proxyapplication/MultiDexForTinker$V4;->access$1(Ljava/lang/ClassLoader;Ljava/lang/reflect/Field;Ljava/util/List;Ljava/io/File;I)Ljava/util/ArrayList;
    :try_end_4
    .catch Ljava/lang/IllegalArgumentException; {:try_start_4 .. :try_end_4} :catch_6
    .catch Ljava/lang/IllegalAccessException; {:try_start_4 .. :try_end_4} :catch_8
    .catch Ljava/io/IOException; {:try_start_4 .. :try_end_4} :catch_9
    .catch Ljava/lang/NoSuchFieldException; {:try_start_4 .. :try_end_4} :catch_7

    move-result-object v9

    goto :goto_0

    .line 397
    .end local v1    # "e":Ljava/lang/NoSuchFieldException;
    :catch_3
    move-exception v3

    .line 399
    .local v3, "e2":Ljava/lang/reflect/InvocationTargetException;
    :try_start_5
    invoke-virtual {v3}, Ljava/lang/reflect/InvocationTargetException;->printStackTrace()V

    goto :goto_1

    .line 400
    .end local v3    # "e2":Ljava/lang/reflect/InvocationTargetException;
    :catch_4
    move-exception v4

    .line 402
    .local v4, "e3":Ljava/lang/NoSuchMethodException;
    invoke-virtual {v4}, Ljava/lang/NoSuchMethodException;->printStackTrace()V

    goto :goto_1

    .line 404
    .end local v4    # "e3":Ljava/lang/NoSuchMethodException;
    :catch_5
    move-exception v5

    .line 407
    .local v5, "e4":Ljava/io/IOException;
    new-instance v9, Ljava/io/IOException;

    const-string v10, "v19,load dex fail"

    invoke-direct {v9, v10}, Ljava/io/IOException;-><init>(Ljava/lang/String;)V

    throw v9
    :try_end_5
    .catch Ljava/lang/NoSuchFieldException; {:try_start_5 .. :try_end_5} :catch_2

    .line 418
    .end local v5    # "e4":Ljava/io/IOException;
    .restart local v1    # "e":Ljava/lang/NoSuchFieldException;
    :catch_6
    move-exception v2

    .line 420
    .local v2, "e1":Ljava/lang/IllegalArgumentException;
    :try_start_6
    invoke-virtual {v2}, Ljava/lang/IllegalArgumentException;->printStackTrace()V
    :try_end_6
    .catch Ljava/lang/NoSuchFieldException; {:try_start_6 .. :try_end_6} :catch_7

    goto :goto_1

    .line 429
    .end local v2    # "e1":Ljava/lang/IllegalArgumentException;
    :catch_7
    move-exception v5

    .line 431
    .local v5, "e4":Ljava/lang/NoSuchFieldException;
    goto :goto_1

    .line 421
    .end local v5    # "e4":Ljava/lang/NoSuchFieldException;
    :catch_8
    move-exception v3

    .line 423
    .local v3, "e2":Ljava/lang/IllegalAccessException;
    :try_start_7
    invoke-virtual {v3}, Ljava/lang/IllegalAccessException;->printStackTrace()V

    goto :goto_1

    .line 424
    .end local v3    # "e2":Ljava/lang/IllegalAccessException;
    :catch_9
    move-exception v4

    .line 427
    .local v4, "e3":Ljava/io/IOException;
    new-instance v9, Ljava/io/IOException;

    const-string v10, "v4, load dex fail"

    invoke-direct {v9, v10}, Ljava/io/IOException;-><init>(Ljava/lang/String;)V

    throw v9
    :try_end_7
    .catch Ljava/lang/NoSuchFieldException; {:try_start_7 .. :try_end_7} :catch_7
.end method

.method private static openallDexes(Ljava/lang/ClassLoader;Ljava/lang/String;Ljava/lang/String;)Ljava/util/ArrayList;
    .locals 15
    .param p0, "loader"    # Ljava/lang/ClassLoader;
    .param p1, "jarordexpathlist"    # Ljava/lang/String;
    .param p2, "Odexpath"    # Ljava/lang/String;
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "(",
            "Ljava/lang/ClassLoader;",
            "Ljava/lang/String;",
            "Ljava/lang/String;",
            ")",
            "Ljava/util/ArrayList",
            "<",
            "Ljava/lang/Object;",
            ">;"
        }
    .end annotation

    .prologue
    .line 263
    const/4 v10, 0x0

    .line 264
    .local v10, "pathListField":Ljava/lang/reflect/Field;
    invoke-static/range {p1 .. p1}, Lcom/wrapper/proxyapplication/MultiDexForTinker;->splitPaths(Ljava/lang/String;)Ljava/util/ArrayList;

    move-result-object v5

    .line 265
    .local v5, "jarordexfilelist":Ljava/util/ArrayList;, "Ljava/util/ArrayList<Ljava/io/File;>;"
    new-instance v1, Ljava/io/File;

    move-object/from16 v0, p2

    invoke-direct {v1, v0}, Ljava/io/File;-><init>(Ljava/lang/String;)V

    .line 267
    .local v1, "Odexdir":Ljava/io/File;
    const/4 v7, 0x0

    .line 268
    .local v7, "objdexfile":Ljava/lang/Object;
    const/4 v8, 0x0

    .line 270
    .local v8, "objdexfilelist":Ljava/util/ArrayList;, "Ljava/util/ArrayList<Ljava/lang/Object;>;"
    :try_start_0
    const-string v11, "pathList"

    invoke-static {p0, v11}, Lcom/wrapper/proxyapplication/MultiDexForTinker;->findField(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;
    :try_end_0
    .catch Ljava/lang/NoSuchFieldException; {:try_start_0 .. :try_end_0} :catch_3

    move-result-object v10

    .line 272
    :try_start_1
    invoke-virtual {v10, p0}, Ljava/lang/reflect/Field;->get(Ljava/lang/Object;)Ljava/lang/Object;
    :try_end_1
    .catch Ljava/lang/IllegalAccessException; {:try_start_1 .. :try_end_1} :catch_2
    .catch Ljava/lang/IllegalArgumentException; {:try_start_1 .. :try_end_1} :catch_4
    .catch Ljava/lang/NoSuchFieldException; {:try_start_1 .. :try_end_1} :catch_3

    move-result-object v2

    .line 274
    .local v2, "dexPathList":Ljava/lang/Object;
    :try_start_2
    const-string v11, "loadDexFile"

    const/4 v12, 0x2

    new-array v12, v12, [Ljava/lang/Class;

    const/4 v13, 0x0

    const-class v14, Ljava/io/File;

    aput-object v14, v12, v13

    const/4 v13, 0x1

    const-class v14, Ljava/io/File;

    aput-object v14, v12, v13

    invoke-static {v2, v11, v12}, Lcom/wrapper/proxyapplication/MultiDexForTinker;->findMethod(Ljava/lang/Object;Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;
    :try_end_2
    .catch Ljava/lang/NoSuchMethodException; {:try_start_2 .. :try_end_2} :catch_1
    .catch Ljava/lang/IllegalAccessException; {:try_start_2 .. :try_end_2} :catch_2
    .catch Ljava/lang/IllegalArgumentException; {:try_start_2 .. :try_end_2} :catch_4
    .catch Ljava/lang/NoSuchFieldException; {:try_start_2 .. :try_end_2} :catch_3

    move-result-object v6

    .line 276
    .local v6, "loadDexFileId":Ljava/lang/reflect/Method;
    :try_start_3
    new-instance v9, Ljava/util/ArrayList;

    invoke-direct {v9}, Ljava/util/ArrayList;-><init>()V
    :try_end_3
    .catch Ljava/lang/reflect/InvocationTargetException; {:try_start_3 .. :try_end_3} :catch_9
    .catch Ljava/lang/NoSuchMethodException; {:try_start_3 .. :try_end_3} :catch_1
    .catch Ljava/lang/IllegalAccessException; {:try_start_3 .. :try_end_3} :catch_2
    .catch Ljava/lang/IllegalArgumentException; {:try_start_3 .. :try_end_3} :catch_4
    .catch Ljava/lang/NoSuchFieldException; {:try_start_3 .. :try_end_3} :catch_3

    .line 279
    .end local v8    # "objdexfilelist":Ljava/util/ArrayList;, "Ljava/util/ArrayList<Ljava/lang/Object;>;"
    .local v9, "objdexfilelist":Ljava/util/ArrayList;, "Ljava/util/ArrayList<Ljava/lang/Object;>;"
    :try_start_4
    invoke-virtual {v5}, Ljava/util/ArrayList;->iterator()Ljava/util/Iterator;

    move-result-object v3

    .line 282
    .end local v7    # "objdexfile":Ljava/lang/Object;
    .local v3, "dexfileit":Ljava/util/Iterator;
    :goto_0
    invoke-interface {v3}, Ljava/util/Iterator;->hasNext()Z

    move-result v11

    if-nez v11, :cond_0

    move-object v8, v9

    .line 316
    .end local v2    # "dexPathList":Ljava/lang/Object;
    .end local v3    # "dexfileit":Ljava/util/Iterator;
    .end local v6    # "loadDexFileId":Ljava/lang/reflect/Method;
    .end local v9    # "objdexfilelist":Ljava/util/ArrayList;, "Ljava/util/ArrayList<Ljava/lang/Object;>;"
    .restart local v8    # "objdexfilelist":Ljava/util/ArrayList;, "Ljava/util/ArrayList<Ljava/lang/Object;>;"
    :goto_1
    return-object v8

    .line 284
    .end local v8    # "objdexfilelist":Ljava/util/ArrayList;, "Ljava/util/ArrayList<Ljava/lang/Object;>;"
    .restart local v2    # "dexPathList":Ljava/lang/Object;
    .restart local v3    # "dexfileit":Ljava/util/Iterator;
    .restart local v6    # "loadDexFileId":Ljava/lang/reflect/Method;
    .restart local v9    # "objdexfilelist":Ljava/util/ArrayList;, "Ljava/util/ArrayList<Ljava/lang/Object;>;"
    :cond_0
    const/4 v11, 0x2

    new-array v11, v11, [Ljava/lang/Object;

    const/4 v12, 0x0

    invoke-interface {v3}, Ljava/util/Iterator;->next()Ljava/lang/Object;

    move-result-object v13

    aput-object v13, v11, v12

    const/4 v12, 0x1

    aput-object v1, v11, v12

    invoke-virtual {v6, v2, v11}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v7

    .line 285
    .restart local v7    # "objdexfile":Ljava/lang/Object;
    invoke-virtual {v9, v7}, Ljava/util/ArrayList;->add(Ljava/lang/Object;)Z
    :try_end_4
    .catch Ljava/lang/reflect/InvocationTargetException; {:try_start_4 .. :try_end_4} :catch_0
    .catch Ljava/lang/NoSuchMethodException; {:try_start_4 .. :try_end_4} :catch_8
    .catch Ljava/lang/IllegalAccessException; {:try_start_4 .. :try_end_4} :catch_7
    .catch Ljava/lang/IllegalArgumentException; {:try_start_4 .. :try_end_4} :catch_6
    .catch Ljava/lang/NoSuchFieldException; {:try_start_4 .. :try_end_4} :catch_5

    goto :goto_0

    .line 293
    .end local v3    # "dexfileit":Ljava/util/Iterator;
    .end local v7    # "objdexfile":Ljava/lang/Object;
    :catch_0
    move-exception v4

    move-object v8, v9

    .line 295
    .end local v9    # "objdexfilelist":Ljava/util/ArrayList;, "Ljava/util/ArrayList<Ljava/lang/Object;>;"
    .local v4, "e":Ljava/lang/reflect/InvocationTargetException;
    .restart local v8    # "objdexfilelist":Ljava/util/ArrayList;, "Ljava/util/ArrayList<Ljava/lang/Object;>;"
    :goto_2
    :try_start_5
    invoke-virtual {v4}, Ljava/lang/reflect/InvocationTargetException;->printStackTrace()V
    :try_end_5
    .catch Ljava/lang/NoSuchMethodException; {:try_start_5 .. :try_end_5} :catch_1
    .catch Ljava/lang/IllegalAccessException; {:try_start_5 .. :try_end_5} :catch_2
    .catch Ljava/lang/IllegalArgumentException; {:try_start_5 .. :try_end_5} :catch_4
    .catch Ljava/lang/NoSuchFieldException; {:try_start_5 .. :try_end_5} :catch_3

    goto :goto_1

    .line 299
    .end local v4    # "e":Ljava/lang/reflect/InvocationTargetException;
    .end local v6    # "loadDexFileId":Ljava/lang/reflect/Method;
    :catch_1
    move-exception v4

    .line 301
    .local v4, "e":Ljava/lang/NoSuchMethodException;
    :goto_3
    :try_start_6
    invoke-virtual {v4}, Ljava/lang/NoSuchMethodException;->printStackTrace()V
    :try_end_6
    .catch Ljava/lang/IllegalAccessException; {:try_start_6 .. :try_end_6} :catch_2
    .catch Ljava/lang/IllegalArgumentException; {:try_start_6 .. :try_end_6} :catch_4
    .catch Ljava/lang/NoSuchFieldException; {:try_start_6 .. :try_end_6} :catch_3

    goto :goto_1

    .line 303
    .end local v2    # "dexPathList":Ljava/lang/Object;
    .end local v4    # "e":Ljava/lang/NoSuchMethodException;
    :catch_2
    move-exception v4

    .line 305
    .local v4, "e":Ljava/lang/IllegalAccessException;
    :goto_4
    :try_start_7
    invoke-virtual {v4}, Ljava/lang/IllegalAccessException;->printStackTrace()V
    :try_end_7
    .catch Ljava/lang/NoSuchFieldException; {:try_start_7 .. :try_end_7} :catch_3

    goto :goto_1

    .line 311
    .end local v4    # "e":Ljava/lang/IllegalAccessException;
    :catch_3
    move-exception v4

    .line 313
    .local v4, "e":Ljava/lang/NoSuchFieldException;
    :goto_5
    invoke-virtual {v4}, Ljava/lang/NoSuchFieldException;->printStackTrace()V

    goto :goto_1

    .line 306
    .end local v4    # "e":Ljava/lang/NoSuchFieldException;
    :catch_4
    move-exception v4

    .line 308
    .local v4, "e":Ljava/lang/IllegalArgumentException;
    :goto_6
    :try_start_8
    invoke-virtual {v4}, Ljava/lang/IllegalArgumentException;->printStackTrace()V
    :try_end_8
    .catch Ljava/lang/NoSuchFieldException; {:try_start_8 .. :try_end_8} :catch_3

    goto :goto_1

    .line 311
    .end local v4    # "e":Ljava/lang/IllegalArgumentException;
    .end local v8    # "objdexfilelist":Ljava/util/ArrayList;, "Ljava/util/ArrayList<Ljava/lang/Object;>;"
    .restart local v2    # "dexPathList":Ljava/lang/Object;
    .restart local v6    # "loadDexFileId":Ljava/lang/reflect/Method;
    .restart local v9    # "objdexfilelist":Ljava/util/ArrayList;, "Ljava/util/ArrayList<Ljava/lang/Object;>;"
    :catch_5
    move-exception v4

    move-object v8, v9

    .end local v9    # "objdexfilelist":Ljava/util/ArrayList;, "Ljava/util/ArrayList<Ljava/lang/Object;>;"
    .restart local v8    # "objdexfilelist":Ljava/util/ArrayList;, "Ljava/util/ArrayList<Ljava/lang/Object;>;"
    goto :goto_5

    .line 306
    .end local v8    # "objdexfilelist":Ljava/util/ArrayList;, "Ljava/util/ArrayList<Ljava/lang/Object;>;"
    .restart local v9    # "objdexfilelist":Ljava/util/ArrayList;, "Ljava/util/ArrayList<Ljava/lang/Object;>;"
    :catch_6
    move-exception v4

    move-object v8, v9

    .end local v9    # "objdexfilelist":Ljava/util/ArrayList;, "Ljava/util/ArrayList<Ljava/lang/Object;>;"
    .restart local v8    # "objdexfilelist":Ljava/util/ArrayList;, "Ljava/util/ArrayList<Ljava/lang/Object;>;"
    goto :goto_6

    .line 303
    .end local v8    # "objdexfilelist":Ljava/util/ArrayList;, "Ljava/util/ArrayList<Ljava/lang/Object;>;"
    .restart local v9    # "objdexfilelist":Ljava/util/ArrayList;, "Ljava/util/ArrayList<Ljava/lang/Object;>;"
    :catch_7
    move-exception v4

    move-object v8, v9

    .end local v9    # "objdexfilelist":Ljava/util/ArrayList;, "Ljava/util/ArrayList<Ljava/lang/Object;>;"
    .restart local v8    # "objdexfilelist":Ljava/util/ArrayList;, "Ljava/util/ArrayList<Ljava/lang/Object;>;"
    goto :goto_4

    .line 299
    .end local v8    # "objdexfilelist":Ljava/util/ArrayList;, "Ljava/util/ArrayList<Ljava/lang/Object;>;"
    .restart local v9    # "objdexfilelist":Ljava/util/ArrayList;, "Ljava/util/ArrayList<Ljava/lang/Object;>;"
    :catch_8
    move-exception v4

    move-object v8, v9

    .end local v9    # "objdexfilelist":Ljava/util/ArrayList;, "Ljava/util/ArrayList<Ljava/lang/Object;>;"
    .restart local v8    # "objdexfilelist":Ljava/util/ArrayList;, "Ljava/util/ArrayList<Ljava/lang/Object;>;"
    goto :goto_3

    .line 293
    .restart local v7    # "objdexfile":Ljava/lang/Object;
    :catch_9
    move-exception v4

    goto :goto_2
.end method

.method private static prepareexpandFieldArray(Ljava/lang/Object;Ljava/lang/String;I)V
    .locals 6
    .param p0, "instance"    # Ljava/lang/Object;
    .param p1, "fieldName"    # Ljava/lang/String;
    .param p2, "dexnum"    # I
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/NoSuchFieldException;,
            Ljava/lang/IllegalArgumentException;,
            Ljava/lang/IllegalAccessException;
        }
    .end annotation

    .prologue
    const/4 v5, 0x0

    .line 690
    invoke-static {p0, p1}, Lcom/wrapper/proxyapplication/MultiDexForTinker;->findField(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v1

    .line 691
    .local v1, "jlrField":Ljava/lang/reflect/Field;
    invoke-virtual {v1, p0}, Ljava/lang/reflect/Field;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v2

    check-cast v2, [Ljava/lang/Object;

    .line 694
    .local v2, "original":[Ljava/lang/Object;
    invoke-virtual {v2}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v3

    invoke-virtual {v3}, Ljava/lang/Class;->getComponentType()Ljava/lang/Class;

    move-result-object v3

    array-length v4, v2

    add-int/2addr v4, p2

    .line 693
    invoke-static {v3, v4}, Ljava/lang/reflect/Array;->newInstance(Ljava/lang/Class;I)Ljava/lang/Object;

    move-result-object v0

    check-cast v0, [Ljava/lang/Object;

    .line 709
    .local v0, "combined":[Ljava/lang/Object;
    array-length v3, v2

    invoke-static {v2, v5, v0, v5, v3}, Ljava/lang/System;->arraycopy(Ljava/lang/Object;ILjava/lang/Object;II)V

    .line 710
    array-length v3, v2

    sput v3, Lcom/wrapper/proxyapplication/MultiDexForTinker;->injectDexBeginIndex:I

    .line 712
    const-string v3, "dexElements"

    invoke-virtual {p1, v3}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v3

    if-eqz v3, :cond_1

    .line 714
    sput-object v0, Lcom/wrapper/proxyapplication/MultiDexForTinker;->injectPathListObj:[Ljava/lang/Object;

    .line 732
    :cond_0
    :goto_0
    return-void

    .line 716
    :cond_1
    const-string v3, "mPaths"

    invoke-virtual {p1, v3}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v3

    if-eqz v3, :cond_2

    .line 718
    sput-object v0, Lcom/wrapper/proxyapplication/MultiDexForTinker;->injectPathsObj:[Ljava/lang/Object;

    goto :goto_0

    .line 720
    :cond_2
    const-string v3, "mFiles"

    invoke-virtual {p1, v3}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v3

    if-eqz v3, :cond_3

    .line 722
    sput-object v0, Lcom/wrapper/proxyapplication/MultiDexForTinker;->injectFilesObj:[Ljava/lang/Object;

    goto :goto_0

    .line 724
    :cond_3
    const-string v3, "mZips"

    invoke-virtual {p1, v3}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v3

    if-eqz v3, :cond_4

    .line 726
    sput-object v0, Lcom/wrapper/proxyapplication/MultiDexForTinker;->injectZipsObj:[Ljava/lang/Object;

    goto :goto_0

    .line 728
    :cond_4
    const-string v3, "mDexs"

    invoke-virtual {p1, v3}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v3

    if-eqz v3, :cond_0

    .line 730
    sput-object v0, Lcom/wrapper/proxyapplication/MultiDexForTinker;->injectDexsObj:[Ljava/lang/Object;

    goto :goto_0
.end method

.method private static preparetoinstallDexes(Ljava/lang/ClassLoader;I)V
    .locals 9
    .param p0, "loader"    # Ljava/lang/ClassLoader;
    .param p1, "dexnum"    # I
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;
        }
    .end annotation

    .prologue
    .line 441
    const/4 v6, 0x0

    .line 443
    .local v6, "pathListField":Ljava/lang/reflect/Field;
    :try_start_0
    const-string v7, "pathList"

    invoke-static {p0, v7}, Lcom/wrapper/proxyapplication/MultiDexForTinker;->findField(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;
    :try_end_0
    .catch Ljava/lang/NoSuchFieldException; {:try_start_0 .. :try_end_0} :catch_1

    move-result-object v6

    .line 445
    :try_start_1
    invoke-virtual {v6, p0}, Ljava/lang/reflect/Field;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v0

    .line 446
    .local v0, "dexPathList":Ljava/lang/Object;
    const-string v7, "dexElements"

    invoke-static {v0, v7, p1}, Lcom/wrapper/proxyapplication/MultiDexForTinker;->prepareexpandFieldArray(Ljava/lang/Object;Ljava/lang/String;I)V
    :try_end_1
    .catch Ljava/lang/IllegalArgumentException; {:try_start_1 .. :try_end_1} :catch_0
    .catch Ljava/lang/IllegalAccessException; {:try_start_1 .. :try_end_1} :catch_4
    .catch Ljava/lang/NoSuchFieldException; {:try_start_1 .. :try_end_1} :catch_1

    .line 483
    .end local v0    # "dexPathList":Ljava/lang/Object;
    :goto_0
    return-void

    .line 449
    :catch_0
    move-exception v5

    .line 451
    .local v5, "e5":Ljava/lang/IllegalArgumentException;
    :try_start_2
    invoke-virtual {v5}, Ljava/lang/IllegalArgumentException;->printStackTrace()V
    :try_end_2
    .catch Ljava/lang/NoSuchFieldException; {:try_start_2 .. :try_end_2} :catch_1

    goto :goto_0

    .line 457
    .end local v5    # "e5":Ljava/lang/IllegalArgumentException;
    :catch_1
    move-exception v1

    .line 461
    .local v1, "e":Ljava/lang/NoSuchFieldException;
    :try_start_3
    const-string v7, "path"

    invoke-static {p0, v7}, Lcom/wrapper/proxyapplication/MultiDexForTinker;->findField(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;
    :try_end_3
    .catch Ljava/lang/NoSuchFieldException; {:try_start_3 .. :try_end_3} :catch_3

    move-result-object v6

    .line 463
    :try_start_4
    const-string v7, "mPaths"

    invoke-static {p0, v7, p1}, Lcom/wrapper/proxyapplication/MultiDexForTinker;->prepareexpandFieldArray(Ljava/lang/Object;Ljava/lang/String;I)V

    .line 464
    const-string v7, "mFiles"

    invoke-static {p0, v7, p1}, Lcom/wrapper/proxyapplication/MultiDexForTinker;->prepareexpandFieldArray(Ljava/lang/Object;Ljava/lang/String;I)V

    .line 465
    const-string v7, "mZips"

    invoke-static {p0, v7, p1}, Lcom/wrapper/proxyapplication/MultiDexForTinker;->prepareexpandFieldArray(Ljava/lang/Object;Ljava/lang/String;I)V

    .line 466
    const-string v7, "mDexs"

    invoke-static {p0, v7, p1}, Lcom/wrapper/proxyapplication/MultiDexForTinker;->prepareexpandFieldArray(Ljava/lang/Object;Ljava/lang/String;I)V
    :try_end_4
    .catch Ljava/lang/IllegalArgumentException; {:try_start_4 .. :try_end_4} :catch_2
    .catch Ljava/lang/IllegalAccessException; {:try_start_4 .. :try_end_4} :catch_5
    .catch Ljava/lang/NoSuchFieldException; {:try_start_4 .. :try_end_4} :catch_3

    goto :goto_0

    .line 469
    :catch_2
    move-exception v2

    .line 471
    .local v2, "e1":Ljava/lang/IllegalArgumentException;
    :try_start_5
    invoke-virtual {v2}, Ljava/lang/IllegalArgumentException;->printStackTrace()V
    :try_end_5
    .catch Ljava/lang/NoSuchFieldException; {:try_start_5 .. :try_end_5} :catch_3

    goto :goto_0

    .line 476
    .end local v2    # "e1":Ljava/lang/IllegalArgumentException;
    :catch_3
    move-exception v4

    .line 478
    .local v4, "e4":Ljava/lang/NoSuchFieldException;
    goto :goto_0

    .line 452
    .end local v1    # "e":Ljava/lang/NoSuchFieldException;
    .end local v4    # "e4":Ljava/lang/NoSuchFieldException;
    :catch_4
    move-exception v2

    .line 454
    .local v2, "e1":Ljava/lang/IllegalAccessException;
    :try_start_6
    invoke-virtual {v2}, Ljava/lang/IllegalAccessException;->printStackTrace()V
    :try_end_6
    .catch Ljava/lang/NoSuchFieldException; {:try_start_6 .. :try_end_6} :catch_1

    goto :goto_0

    .line 472
    .end local v2    # "e1":Ljava/lang/IllegalAccessException;
    .restart local v1    # "e":Ljava/lang/NoSuchFieldException;
    :catch_5
    move-exception v3

    .line 474
    .local v3, "e2":Ljava/lang/IllegalAccessException;
    :try_start_7
    invoke-virtual {v3}, Ljava/lang/IllegalAccessException;->printStackTrace()V
    :try_end_7
    .catch Ljava/lang/NoSuchFieldException; {:try_start_7 .. :try_end_7} :catch_3

    goto :goto_0
.end method

.method private static splitPaths(Ljava/lang/String;)Ljava/util/ArrayList;
    .locals 6
    .param p0, "searchPath"    # Ljava/lang/String;
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "(",
            "Ljava/lang/String;",
            ")",
            "Ljava/util/ArrayList",
            "<",
            "Ljava/io/File;",
            ">;"
        }
    .end annotation

    .prologue
    .line 218
    new-instance v1, Ljava/util/ArrayList;

    invoke-direct {v1}, Ljava/util/ArrayList;-><init>()V

    .line 220
    .local v1, "result":Ljava/util/ArrayList;, "Ljava/util/ArrayList<Ljava/io/File;>;"
    if-eqz p0, :cond_0

    .line 221
    sget-object v2, Ljava/io/File;->pathSeparator:Ljava/lang/String;

    invoke-virtual {p0, v2}, Ljava/lang/String;->split(Ljava/lang/String;)[Ljava/lang/String;

    move-result-object v3

    array-length v4, v3

    const/4 v2, 0x0

    :goto_0
    if-lt v2, v4, :cond_1

    .line 227
    :cond_0
    return-object v1

    .line 221
    :cond_1
    aget-object v0, v3, v2

    .line 223
    .local v0, "path":Ljava/lang/String;
    new-instance v5, Ljava/io/File;

    invoke-direct {v5, v0}, Ljava/io/File;-><init>(Ljava/lang/String;)V

    invoke-virtual {v1, v5}, Ljava/util/ArrayList;->add(Ljava/lang/Object;)Z

    .line 221
    add-int/lit8 v2, v2, 0x1

    goto :goto_0
.end method
