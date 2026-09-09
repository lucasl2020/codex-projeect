.class final Lcom/wrapper/proxyapplication/MultiDex$V19;
.super Ljava/lang/Object;
.source "MultiDex.java"


# annotations
.annotation system Ldalvik/annotation/EnclosingClass;
    value = Lcom/wrapper/proxyapplication/MultiDex;
.end annotation

.annotation system Ldalvik/annotation/InnerClass;
    accessFlags = 0x1a
    name = "V19"
.end annotation


# direct methods
.method private constructor <init>()V
    .locals 0

    .line 716
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    return-void
.end method

.method static synthetic access$000(Ljava/lang/ClassLoader;Ljava/lang/reflect/Field;Ljava/util/List;Ljava/io/File;ZZ)Ljava/util/ArrayList;
    .locals 0
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/IllegalArgumentException;,
            Ljava/lang/IllegalAccessException;,
            Ljava/lang/NoSuchFieldException;,
            Ljava/lang/reflect/InvocationTargetException;,
            Ljava/lang/NoSuchMethodException;
        }
    .end annotation

    .line 716
    invoke-static/range {p0 .. p5}, Lcom/wrapper/proxyapplication/MultiDex$V19;->install(Ljava/lang/ClassLoader;Ljava/lang/reflect/Field;Ljava/util/List;Ljava/io/File;ZZ)Ljava/util/ArrayList;

    move-result-object p0

    return-object p0
.end method

.method static synthetic access$200(Ljava/lang/ClassLoader;Ljava/lang/reflect/Field;Ljava/util/List;Ljava/io/File;IZZ)Ljava/util/ArrayList;
    .locals 0
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/IllegalArgumentException;,
            Ljava/lang/IllegalAccessException;,
            Ljava/lang/NoSuchFieldException;,
            Ljava/lang/reflect/InvocationTargetException;,
            Ljava/lang/NoSuchMethodException;
        }
    .end annotation

    .line 716
    invoke-static/range {p0 .. p6}, Lcom/wrapper/proxyapplication/MultiDex$V19;->install(Ljava/lang/ClassLoader;Ljava/lang/reflect/Field;Ljava/util/List;Ljava/io/File;IZZ)Ljava/util/ArrayList;

    move-result-object p0

    return-object p0
.end method

.method private static install(Ljava/lang/ClassLoader;Ljava/lang/reflect/Field;Ljava/util/List;Ljava/io/File;IZZ)Ljava/util/ArrayList;
    .locals 6
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "(",
            "Ljava/lang/ClassLoader;",
            "Ljava/lang/reflect/Field;",
            "Ljava/util/List<",
            "Ljava/io/File;",
            ">;",
            "Ljava/io/File;",
            "IZZ)",
            "Ljava/util/ArrayList<",
            "Ljava/lang/Object;",
            ">;"
        }
    .end annotation

    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/IllegalArgumentException;,
            Ljava/lang/IllegalAccessException;,
            Ljava/lang/NoSuchFieldException;,
            Ljava/lang/reflect/InvocationTargetException;,
            Ljava/lang/NoSuchMethodException;
        }
    .end annotation

    .line 830
    invoke-virtual {p1, p0}, Ljava/lang/reflect/Field;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object p0

    .line 831
    new-instance p1, Ljava/util/ArrayList;

    invoke-direct {p1}, Ljava/util/ArrayList;-><init>()V

    .line 832
    new-instance p5, Ljava/util/ArrayList;

    invoke-direct {p5, p2}, Ljava/util/ArrayList;-><init>(Ljava/util/Collection;)V

    invoke-static {p0, p5, p3, p1}, Lcom/wrapper/proxyapplication/MultiDex$V19;->makeDexElements(Ljava/lang/Object;Ljava/util/ArrayList;Ljava/io/File;Ljava/util/ArrayList;)[Ljava/lang/Object;

    move-result-object p3

    if-eqz p3, :cond_8

    .line 835
    array-length p5, p3

    invoke-interface {p2}, Ljava/util/List;->size()I

    move-result p2

    if-eq p5, p2, :cond_0

    goto/16 :goto_4

    .line 842
    :cond_0
    new-instance p2, Ljava/util/ArrayList;

    invoke-direct {p2}, Ljava/util/ArrayList;-><init>()V

    .line 843
    array-length p5, p3

    const/4 v0, 0x0

    const/4 v1, 0x0

    :goto_0
    if-ge v1, p5, :cond_4

    aget-object v2, p3, v1

    const-string v3, "dexFile"

    .line 844
    invoke-static {v2, v3}, Lcom/wrapper/proxyapplication/MultiDex;->access$400(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v3

    .line 845
    invoke-virtual {v3, v2}, Ljava/lang/reflect/Field;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v2

    const-string v3, "mCookie"

    .line 847
    invoke-static {v2, v3}, Lcom/wrapper/proxyapplication/MultiDex;->access$400(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v3

    .line 849
    invoke-virtual {v3}, Ljava/lang/reflect/Field;->getType()Ljava/lang/Class;

    move-result-object v4

    invoke-virtual {v4}, Ljava/lang/Class;->getName()Ljava/lang/String;

    move-result-object v4

    const-string v5, "int"

    invoke-virtual {v4, v5}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v4

    if-eqz v4, :cond_1

    .line 851
    invoke-virtual {v3, v2}, Ljava/lang/reflect/Field;->getInt(Ljava/lang/Object;)I

    move-result v2

    invoke-static {v2}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v2

    .line 852
    invoke-virtual {p2, v2}, Ljava/util/ArrayList;->add(Ljava/lang/Object;)Z

    goto :goto_1

    .line 855
    :cond_1
    invoke-virtual {v3}, Ljava/lang/reflect/Field;->getType()Ljava/lang/Class;

    move-result-object v4

    invoke-virtual {v4}, Ljava/lang/Class;->getName()Ljava/lang/String;

    move-result-object v4

    const-string v5, "long"

    invoke-virtual {v4, v5}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v4

    if-eqz v4, :cond_2

    .line 858
    invoke-virtual {v3, v2}, Ljava/lang/reflect/Field;->getLong(Ljava/lang/Object;)J

    move-result-wide v2

    invoke-static {v2, v3}, Ljava/lang/Long;->valueOf(J)Ljava/lang/Long;

    move-result-object v2

    .line 859
    invoke-virtual {p2, v2}, Ljava/util/ArrayList;->add(Ljava/lang/Object;)Z

    goto :goto_1

    :cond_2
    if-eqz p6, :cond_3

    .line 867
    invoke-virtual {p2, v2}, Ljava/util/ArrayList;->add(Ljava/lang/Object;)Z

    .line 869
    :cond_3
    invoke-virtual {v3, v2}, Ljava/lang/reflect/Field;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v2

    .line 870
    invoke-virtual {p2, v2}, Ljava/util/ArrayList;->add(Ljava/lang/Object;)Z

    :goto_1
    add-int/lit8 v1, v1, 0x1

    goto :goto_0

    :cond_4
    const-string p5, "dexElements"

    .line 878
    invoke-static {p0, p5, p3, p4}, Lcom/wrapper/proxyapplication/MultiDex;->access$600(Ljava/lang/Object;Ljava/lang/String;[Ljava/lang/Object;I)V

    .line 879
    invoke-virtual {p1}, Ljava/util/ArrayList;->size()I

    move-result p3

    if-lez p3, :cond_7

    .line 880
    invoke-virtual {p1}, Ljava/util/ArrayList;->iterator()Ljava/util/Iterator;

    move-result-object p3

    :goto_2
    invoke-interface {p3}, Ljava/util/Iterator;->hasNext()Z

    move-result p4

    if-eqz p4, :cond_5

    invoke-interface {p3}, Ljava/util/Iterator;->next()Ljava/lang/Object;

    move-result-object p4

    check-cast p4, Ljava/io/IOException;

    goto :goto_2

    :cond_5
    const-string p3, "dexElementsSuppressedExceptions"

    .line 883
    invoke-static {p0, p3}, Lcom/wrapper/proxyapplication/MultiDex;->access$400(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object p3

    .line 884
    invoke-virtual {p3, p0}, Ljava/lang/reflect/Field;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object p0

    check-cast p0, [Ljava/io/IOException;

    check-cast p0, [Ljava/io/IOException;

    sput-object p0, Lcom/wrapper/proxyapplication/MultiDex;->dexElementsSuppressedExceptions:[Ljava/io/IOException;

    .line 886
    sget-object p0, Lcom/wrapper/proxyapplication/MultiDex;->dexElementsSuppressedExceptions:[Ljava/io/IOException;

    if-nez p0, :cond_6

    .line 888
    invoke-virtual {p1}, Ljava/util/ArrayList;->size()I

    move-result p0

    new-array p0, p0, [Ljava/io/IOException;

    invoke-virtual {p1, p0}, Ljava/util/ArrayList;->toArray([Ljava/lang/Object;)[Ljava/lang/Object;

    move-result-object p0

    check-cast p0, [Ljava/io/IOException;

    sput-object p0, Lcom/wrapper/proxyapplication/MultiDex;->dexElementsSuppressedExceptions:[Ljava/io/IOException;

    goto :goto_3

    .line 890
    :cond_6
    invoke-virtual {p1}, Ljava/util/ArrayList;->size()I

    move-result p0

    sget-object p3, Lcom/wrapper/proxyapplication/MultiDex;->dexElementsSuppressedExceptions:[Ljava/io/IOException;

    array-length p3, p3

    add-int/2addr p0, p3

    new-array p0, p0, [Ljava/io/IOException;

    .line 892
    invoke-virtual {p1, p0}, Ljava/util/ArrayList;->toArray([Ljava/lang/Object;)[Ljava/lang/Object;

    .line 893
    sget-object p3, Lcom/wrapper/proxyapplication/MultiDex;->dexElementsSuppressedExceptions:[Ljava/io/IOException;

    invoke-virtual {p1}, Ljava/util/ArrayList;->size()I

    move-result p1

    sget-object p4, Lcom/wrapper/proxyapplication/MultiDex;->dexElementsSuppressedExceptions:[Ljava/io/IOException;

    array-length p4, p4

    invoke-static {p3, v0, p0, p1, p4}, Ljava/lang/System;->arraycopy(Ljava/lang/Object;ILjava/lang/Object;II)V

    .line 895
    sput-object p0, Lcom/wrapper/proxyapplication/MultiDex;->dexElementsSuppressedExceptions:[Ljava/io/IOException;

    :cond_7
    :goto_3
    return-object p2

    :cond_8
    :goto_4
    const/4 p0, 0x0

    return-object p0
.end method

.method private static install(Ljava/lang/ClassLoader;Ljava/lang/reflect/Field;Ljava/util/List;Ljava/io/File;ZZ)Ljava/util/ArrayList;
    .locals 8
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "(",
            "Ljava/lang/ClassLoader;",
            "Ljava/lang/reflect/Field;",
            "Ljava/util/List<",
            "Ljava/io/File;",
            ">;",
            "Ljava/io/File;",
            "ZZ)",
            "Ljava/util/ArrayList<",
            "Ljava/lang/Object;",
            ">;"
        }
    .end annotation

    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/IllegalArgumentException;,
            Ljava/lang/IllegalAccessException;,
            Ljava/lang/NoSuchFieldException;,
            Ljava/lang/reflect/InvocationTargetException;,
            Ljava/lang/NoSuchMethodException;
        }
    .end annotation

    .line 729
    invoke-virtual {p1, p0}, Ljava/lang/reflect/Field;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object p0

    .line 730
    new-instance p1, Ljava/util/ArrayList;

    invoke-direct {p1}, Ljava/util/ArrayList;-><init>()V

    .line 731
    new-instance v0, Ljava/util/ArrayList;

    invoke-direct {v0, p2}, Ljava/util/ArrayList;-><init>(Ljava/util/Collection;)V

    invoke-static {p0, v0, p3, p1}, Lcom/wrapper/proxyapplication/MultiDex$V19;->makeDexElements(Ljava/lang/Object;Ljava/util/ArrayList;Ljava/io/File;Ljava/util/ArrayList;)[Ljava/lang/Object;

    move-result-object p3

    const/4 v0, 0x0

    if-eqz p3, :cond_9

    .line 734
    array-length v1, p3

    invoke-interface {p2}, Ljava/util/List;->size()I

    move-result p2

    if-eq v1, p2, :cond_0

    goto/16 :goto_4

    .line 741
    :cond_0
    new-instance p2, Ljava/util/ArrayList;

    invoke-direct {p2}, Ljava/util/ArrayList;-><init>()V

    .line 743
    array-length v1, p3

    const/4 v2, 0x0

    const/4 v3, 0x0

    :goto_0
    if-ge v3, v1, :cond_5

    aget-object v4, p3, v3

    const-string v5, "dexFile"

    .line 745
    invoke-static {v4, v5}, Lcom/wrapper/proxyapplication/MultiDex;->access$400(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v5

    .line 746
    invoke-virtual {v5, v4}, Ljava/lang/reflect/Field;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v4

    const-string v5, "mCookie"

    .line 748
    invoke-static {v4, v5}, Lcom/wrapper/proxyapplication/MultiDex;->access$400(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v5

    .line 751
    invoke-virtual {v5}, Ljava/lang/reflect/Field;->getType()Ljava/lang/Class;

    move-result-object v6

    invoke-virtual {v6}, Ljava/lang/Class;->getName()Ljava/lang/String;

    move-result-object v6

    const-string v7, "int"

    invoke-virtual {v6, v7}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v6

    if-eqz v6, :cond_1

    .line 754
    invoke-virtual {v5, v4}, Ljava/lang/reflect/Field;->getInt(Ljava/lang/Object;)I

    move-result v4

    invoke-static {v4}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v4

    .line 755
    invoke-virtual {p2, v4}, Ljava/util/ArrayList;->add(Ljava/lang/Object;)Z

    goto :goto_1

    .line 759
    :cond_1
    invoke-virtual {v5}, Ljava/lang/reflect/Field;->getType()Ljava/lang/Class;

    move-result-object v6

    invoke-virtual {v6}, Ljava/lang/Class;->getName()Ljava/lang/String;

    move-result-object v6

    const-string v7, "long"

    invoke-virtual {v6, v7}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v6

    if-eqz v6, :cond_2

    .line 763
    invoke-virtual {v5, v4}, Ljava/lang/reflect/Field;->getLong(Ljava/lang/Object;)J

    move-result-wide v6

    invoke-static {v6, v7}, Ljava/lang/Long;->valueOf(J)Ljava/lang/Long;

    move-result-object v6

    .line 764
    invoke-virtual {p2, v6}, Ljava/util/ArrayList;->add(Ljava/lang/Object;)Z

    if-eqz p4, :cond_4

    const-wide/16 v6, 0x0

    .line 766
    invoke-virtual {v5, v4, v6, v7}, Ljava/lang/reflect/Field;->setLong(Ljava/lang/Object;J)V

    goto :goto_1

    :cond_2
    if-eqz p5, :cond_3

    .line 774
    invoke-virtual {p2, v4}, Ljava/util/ArrayList;->add(Ljava/lang/Object;)Z

    .line 778
    :cond_3
    invoke-virtual {v5, v4}, Ljava/lang/reflect/Field;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v6

    .line 779
    invoke-virtual {p2, v6}, Ljava/util/ArrayList;->add(Ljava/lang/Object;)Z

    if-eqz p4, :cond_4

    .line 782
    invoke-virtual {v5, v4, v0}, Ljava/lang/reflect/Field;->set(Ljava/lang/Object;Ljava/lang/Object;)V

    :cond_4
    :goto_1
    add-int/lit8 v3, v3, 0x1

    goto :goto_0

    :cond_5
    const-string p4, "dexElements"

    .line 791
    invoke-static {p0, p4, p3}, Lcom/wrapper/proxyapplication/MultiDex;->access$500(Ljava/lang/Object;Ljava/lang/String;[Ljava/lang/Object;)V

    .line 792
    invoke-virtual {p1}, Ljava/util/ArrayList;->size()I

    move-result p3

    if-lez p3, :cond_8

    .line 793
    invoke-virtual {p1}, Ljava/util/ArrayList;->iterator()Ljava/util/Iterator;

    move-result-object p3

    :goto_2
    invoke-interface {p3}, Ljava/util/Iterator;->hasNext()Z

    move-result p4

    if-eqz p4, :cond_6

    invoke-interface {p3}, Ljava/util/Iterator;->next()Ljava/lang/Object;

    move-result-object p4

    check-cast p4, Ljava/io/IOException;

    goto :goto_2

    :cond_6
    const-string p3, "dexElementsSuppressedExceptions"

    .line 796
    invoke-static {p0, p3}, Lcom/wrapper/proxyapplication/MultiDex;->access$400(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object p3

    .line 798
    invoke-virtual {p3, p0}, Ljava/lang/reflect/Field;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object p4

    check-cast p4, [Ljava/io/IOException;

    check-cast p4, [Ljava/io/IOException;

    if-nez p4, :cond_7

    .line 802
    invoke-virtual {p1}, Ljava/util/ArrayList;->size()I

    move-result p4

    new-array p4, p4, [Ljava/io/IOException;

    invoke-virtual {p1, p4}, Ljava/util/ArrayList;->toArray([Ljava/lang/Object;)[Ljava/lang/Object;

    move-result-object p1

    check-cast p1, [Ljava/io/IOException;

    goto :goto_3

    .line 804
    :cond_7
    invoke-virtual {p1}, Ljava/util/ArrayList;->size()I

    move-result p5

    array-length v0, p4

    add-int/2addr p5, v0

    new-array p5, p5, [Ljava/io/IOException;

    .line 806
    invoke-virtual {p1, p5}, Ljava/util/ArrayList;->toArray([Ljava/lang/Object;)[Ljava/lang/Object;

    .line 807
    invoke-virtual {p1}, Ljava/util/ArrayList;->size()I

    move-result p1

    array-length v0, p4

    invoke-static {p4, v2, p5, p1, v0}, Ljava/lang/System;->arraycopy(Ljava/lang/Object;ILjava/lang/Object;II)V

    move-object p1, p5

    .line 812
    :goto_3
    invoke-virtual {p3, p0, p1}, Ljava/lang/reflect/Field;->set(Ljava/lang/Object;Ljava/lang/Object;)V

    :cond_8
    const/4 p0, 0x1

    .line 815
    sput p0, Lcom/wrapper/proxyapplication/MultiDex;->hasInjected:I

    return-object p2

    :cond_9
    :goto_4
    return-object v0
.end method

.method private static makeDexElements(Ljava/lang/Object;Ljava/util/ArrayList;Ljava/io/File;Ljava/util/ArrayList;)[Ljava/lang/Object;
    .locals 9
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "(",
            "Ljava/lang/Object;",
            "Ljava/util/ArrayList<",
            "Ljava/io/File;",
            ">;",
            "Ljava/io/File;",
            "Ljava/util/ArrayList<",
            "Ljava/io/IOException;",
            ">;)[",
            "Ljava/lang/Object;"
        }
    .end annotation

    const-string v0, "makeDexElements"

    const/4 v1, 0x1

    const/4 v2, 0x0

    const/4 v3, 0x2

    :try_start_0
    new-array v4, v3, [Ljava/lang/Class;

    .line 914
    const-class v5, Ljava/util/ArrayList;

    aput-object v5, v4, v2

    const-class v5, Ljava/io/File;

    aput-object v5, v4, v1

    invoke-static {p0, v0, v4}, Lcom/wrapper/proxyapplication/MultiDex;->access$700(Ljava/lang/Object;Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v4
    :try_end_0
    .catch Ljava/lang/NoSuchMethodException; {:try_start_0 .. :try_end_0} :catch_4

    :try_start_1
    new-array v5, v3, [Ljava/lang/Object;

    aput-object p1, v5, v2

    aput-object p2, v5, v1

    .line 916
    invoke-virtual {v4, p0, v5}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v4

    check-cast v4, [Ljava/lang/Object;

    check-cast v4, [Ljava/lang/Object;
    :try_end_1
    .catch Ljava/lang/IllegalAccessException; {:try_start_1 .. :try_end_1} :catch_3
    .catch Ljava/lang/IllegalArgumentException; {:try_start_1 .. :try_end_1} :catch_2
    .catch Ljava/lang/reflect/InvocationTargetException; {:try_start_1 .. :try_end_1} :catch_1
    .catch Ljava/lang/RuntimeException; {:try_start_1 .. :try_end_1} :catch_0
    .catch Ljava/lang/NoSuchMethodException; {:try_start_1 .. :try_end_1} :catch_4

    return-object v4

    :catch_0
    move-exception v4

    .line 928
    :try_start_2
    invoke-virtual {v4}, Ljava/lang/RuntimeException;->printStackTrace()V

    goto/16 :goto_2

    :catch_1
    move-exception v4

    .line 925
    invoke-virtual {v4}, Ljava/lang/reflect/InvocationTargetException;->printStackTrace()V

    goto/16 :goto_2

    :catch_2
    move-exception v4

    .line 922
    invoke-virtual {v4}, Ljava/lang/IllegalArgumentException;->printStackTrace()V

    goto/16 :goto_2

    :catch_3
    move-exception v4

    .line 919
    invoke-virtual {v4}, Ljava/lang/IllegalAccessException;->printStackTrace()V
    :try_end_2
    .catch Ljava/lang/NoSuchMethodException; {:try_start_2 .. :try_end_2} :catch_4

    goto/16 :goto_2

    :catch_4
    move-exception v4

    const/4 v5, 0x3

    :try_start_3
    new-array v6, v5, [Ljava/lang/Class;

    .line 934
    const-class v7, Ljava/util/ArrayList;

    aput-object v7, v6, v2

    const-class v7, Ljava/io/File;

    aput-object v7, v6, v1

    const-class v7, Ljava/util/ArrayList;

    aput-object v7, v6, v3

    invoke-static {p0, v0, v6}, Lcom/wrapper/proxyapplication/MultiDex;->access$700(Ljava/lang/Object;Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v0
    :try_end_3
    .catch Ljava/lang/NoSuchMethodException; {:try_start_3 .. :try_end_3} :catch_9

    :try_start_4
    new-array v6, v5, [Ljava/lang/Object;

    aput-object p1, v6, v2

    aput-object p2, v6, v1

    aput-object p3, v6, v3

    .line 937
    invoke-virtual {v0, p0, v6}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v0

    check-cast v0, [Ljava/lang/Object;

    check-cast v0, [Ljava/lang/Object;
    :try_end_4
    .catch Ljava/lang/IllegalAccessException; {:try_start_4 .. :try_end_4} :catch_8
    .catch Ljava/lang/IllegalArgumentException; {:try_start_4 .. :try_end_4} :catch_7
    .catch Ljava/lang/reflect/InvocationTargetException; {:try_start_4 .. :try_end_4} :catch_6
    .catch Ljava/lang/RuntimeException; {:try_start_4 .. :try_end_4} :catch_5
    .catch Ljava/lang/NoSuchMethodException; {:try_start_4 .. :try_end_4} :catch_9

    return-object v0

    :catch_5
    move-exception v0

    .line 950
    :try_start_5
    invoke-virtual {v0}, Ljava/lang/RuntimeException;->printStackTrace()V

    goto :goto_1

    :catch_6
    move-exception v0

    .line 947
    invoke-virtual {v0}, Ljava/lang/reflect/InvocationTargetException;->printStackTrace()V

    goto :goto_1

    :catch_7
    move-exception v0

    .line 944
    invoke-virtual {v0}, Ljava/lang/IllegalArgumentException;->printStackTrace()V

    goto :goto_1

    :catch_8
    move-exception v0

    .line 941
    invoke-virtual {v0}, Ljava/lang/IllegalAccessException;->printStackTrace()V
    :try_end_5
    .catch Ljava/lang/NoSuchMethodException; {:try_start_5 .. :try_end_5} :catch_9

    goto :goto_1

    :catch_9
    move-exception v0

    :try_start_6
    const-string v6, "makePathElements"

    new-array v7, v5, [Ljava/lang/Class;

    .line 956
    const-class v8, Ljava/util/List;

    aput-object v8, v7, v2

    const-class v8, Ljava/io/File;

    aput-object v8, v7, v1

    const-class v8, Ljava/util/List;

    aput-object v8, v7, v3

    invoke-static {p0, v6, v7}, Lcom/wrapper/proxyapplication/MultiDex;->access$700(Ljava/lang/Object;Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v6
    :try_end_6
    .catch Ljava/lang/NoSuchMethodException; {:try_start_6 .. :try_end_6} :catch_e
    .catch Ljava/lang/RuntimeException; {:try_start_6 .. :try_end_6} :catch_d

    :try_start_7
    new-array v5, v5, [Ljava/lang/Object;

    aput-object p1, v5, v2

    aput-object p2, v5, v1

    aput-object p3, v5, v3

    .line 959
    invoke-virtual {v6, p0, v5}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object p0

    check-cast p0, [Ljava/lang/Object;

    check-cast p0, [Ljava/lang/Object;
    :try_end_7
    .catch Ljava/lang/IllegalAccessException; {:try_start_7 .. :try_end_7} :catch_c
    .catch Ljava/lang/IllegalArgumentException; {:try_start_7 .. :try_end_7} :catch_b
    .catch Ljava/lang/reflect/InvocationTargetException; {:try_start_7 .. :try_end_7} :catch_a
    .catch Ljava/lang/NoSuchMethodException; {:try_start_7 .. :try_end_7} :catch_e
    .catch Ljava/lang/RuntimeException; {:try_start_7 .. :try_end_7} :catch_d

    return-object p0

    :catch_a
    move-exception p0

    .line 969
    :try_start_8
    invoke-virtual {p0}, Ljava/lang/reflect/InvocationTargetException;->printStackTrace()V

    goto :goto_0

    :catch_b
    move-exception p0

    .line 966
    invoke-virtual {p0}, Ljava/lang/IllegalArgumentException;->printStackTrace()V

    goto :goto_0

    :catch_c
    move-exception p0

    .line 963
    invoke-virtual {p0}, Ljava/lang/IllegalAccessException;->printStackTrace()V
    :try_end_8
    .catch Ljava/lang/NoSuchMethodException; {:try_start_8 .. :try_end_8} :catch_e
    .catch Ljava/lang/RuntimeException; {:try_start_8 .. :try_end_8} :catch_d

    goto :goto_0

    :catch_d
    move-exception p0

    .line 977
    invoke-virtual {p0}, Ljava/lang/RuntimeException;->printStackTrace()V

    goto :goto_0

    :catch_e
    move-exception p0

    .line 974
    invoke-virtual {p0}, Ljava/lang/NoSuchMethodException;->printStackTrace()V

    .line 979
    :goto_0
    invoke-virtual {v0}, Ljava/lang/NoSuchMethodException;->printStackTrace()V

    .line 981
    :goto_1
    invoke-virtual {v4}, Ljava/lang/NoSuchMethodException;->printStackTrace()V

    :goto_2
    const/4 p0, 0x0

    return-object p0
.end method
