.class final Lcom/wrapper/proxyapplication/MultiDex$V4;
.super Ljava/lang/Object;
.source "MultiDex.java"


# annotations
.annotation system Ldalvik/annotation/EnclosingClass;
    value = Lcom/wrapper/proxyapplication/MultiDex;
.end annotation

.annotation system Ldalvik/annotation/InnerClass;
    accessFlags = 0x1a
    name = "V4"
.end annotation


# direct methods
.method private constructor <init>()V
    .locals 0

    .line 992
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    return-void
.end method

.method static synthetic access$100(Ljava/lang/ClassLoader;Ljava/lang/reflect/Field;Ljava/util/List;Ljava/io/File;)Ljava/util/ArrayList;
    .locals 0
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/IllegalArgumentException;,
            Ljava/lang/IllegalAccessException;,
            Ljava/lang/NoSuchFieldException;,
            Ljava/io/IOException;
        }
    .end annotation

    .line 992
    invoke-static {p0, p1, p2, p3}, Lcom/wrapper/proxyapplication/MultiDex$V4;->install(Ljava/lang/ClassLoader;Ljava/lang/reflect/Field;Ljava/util/List;Ljava/io/File;)Ljava/util/ArrayList;

    move-result-object p0

    return-object p0
.end method

.method static synthetic access$300(Ljava/lang/ClassLoader;Ljava/lang/reflect/Field;Ljava/util/List;Ljava/io/File;I)Ljava/util/ArrayList;
    .locals 0
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/IllegalArgumentException;,
            Ljava/lang/IllegalAccessException;,
            Ljava/lang/NoSuchFieldException;,
            Ljava/io/IOException;
        }
    .end annotation

    .line 992
    invoke-static {p0, p1, p2, p3, p4}, Lcom/wrapper/proxyapplication/MultiDex$V4;->install(Ljava/lang/ClassLoader;Ljava/lang/reflect/Field;Ljava/util/List;Ljava/io/File;I)Ljava/util/ArrayList;

    move-result-object p0

    return-object p0
.end method

.method private static install(Ljava/lang/ClassLoader;Ljava/lang/reflect/Field;Ljava/util/List;Ljava/io/File;)Ljava/util/ArrayList;
    .locals 12
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "(",
            "Ljava/lang/ClassLoader;",
            "Ljava/lang/reflect/Field;",
            "Ljava/util/List<",
            "Ljava/io/File;",
            ">;",
            "Ljava/io/File;",
            ")",
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
            Ljava/io/IOException;
        }
    .end annotation

    .line 1001
    invoke-interface {p2}, Ljava/util/List;->size()I

    move-result v0

    .line 1005
    new-instance v1, Ljava/lang/StringBuilder;

    invoke-virtual {p1, p0}, Ljava/lang/reflect/Field;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v2

    check-cast v2, Ljava/lang/String;

    invoke-direct {v1, v2}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    .line 1006
    new-array v2, v0, [Ljava/lang/String;

    .line 1007
    new-array v3, v0, [Ljava/io/File;

    .line 1008
    new-array v4, v0, [Ljava/util/zip/ZipFile;

    .line 1009
    new-array v0, v0, [Ldalvik/system/DexFile;

    .line 1011
    new-instance v5, Ljava/util/ArrayList;

    invoke-direct {v5}, Ljava/util/ArrayList;-><init>()V

    .line 1013
    invoke-interface {p2}, Ljava/util/List;->listIterator()Ljava/util/ListIterator;

    move-result-object p2

    :goto_0
    invoke-interface {p2}, Ljava/util/ListIterator;->hasNext()Z

    move-result v6

    if-eqz v6, :cond_0

    .line 1014
    invoke-interface {p2}, Ljava/util/ListIterator;->next()Ljava/lang/Object;

    move-result-object v6

    check-cast v6, Ljava/io/File;

    .line 1015
    invoke-virtual {v6}, Ljava/io/File;->getAbsolutePath()Ljava/lang/String;

    move-result-object v7

    .line 1016
    invoke-virtual {p3}, Ljava/io/File;->getAbsolutePath()Ljava/lang/String;

    move-result-object v8

    .line 1017
    invoke-static {v7}, Lcom/wrapper/proxyapplication/MultiDex;->access$800(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v9

    const/16 v10, 0x3a

    .line 1018
    invoke-virtual {v1, v10}, Ljava/lang/StringBuilder;->append(C)Ljava/lang/StringBuilder;

    invoke-virtual {v1, v7}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 1019
    invoke-interface {p2}, Ljava/util/ListIterator;->previousIndex()I

    move-result v10

    .line 1020
    aput-object v7, v2, v10

    .line 1021
    aput-object v6, v3, v10

    .line 1022
    new-instance v11, Ljava/util/zip/ZipFile;

    invoke-direct {v11, v6}, Ljava/util/zip/ZipFile;-><init>(Ljava/io/File;)V

    aput-object v11, v4, v10

    .line 1023
    new-instance v6, Ljava/lang/StringBuilder;

    invoke-direct {v6}, Ljava/lang/StringBuilder;-><init>()V

    invoke-virtual {v6, v8}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string v8, "/"

    invoke-virtual {v6, v8}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v6, v9}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string v8, ".dex"

    invoke-virtual {v6, v8}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v6}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v6

    const/4 v8, 0x0

    invoke-static {v7, v6, v8}, Ldalvik/system/DexFile;->loadDex(Ljava/lang/String;Ljava/lang/String;I)Ldalvik/system/DexFile;

    move-result-object v6

    aput-object v6, v0, v10

    .line 1024
    aget-object v6, v0, v10

    const-string v7, "mCookie"

    invoke-static {v6, v7}, Lcom/wrapper/proxyapplication/MultiDex;->access$400(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v6

    .line 1025
    aget-object v7, v0, v10

    invoke-virtual {v6, v7}, Ljava/lang/reflect/Field;->getInt(Ljava/lang/Object;)I

    move-result v6

    invoke-static {v6}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v6

    .line 1027
    invoke-virtual {v5, v6}, Ljava/util/ArrayList;->add(Ljava/lang/Object;)Z

    goto :goto_0

    .line 1030
    :cond_0
    invoke-virtual {v1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p2

    invoke-virtual {p1, p0, p2}, Ljava/lang/reflect/Field;->set(Ljava/lang/Object;Ljava/lang/Object;)V

    const-string p1, "mPaths"

    .line 1031
    invoke-static {p0, p1, v2}, Lcom/wrapper/proxyapplication/MultiDex;->access$500(Ljava/lang/Object;Ljava/lang/String;[Ljava/lang/Object;)V

    const-string p1, "mFiles"

    .line 1032
    invoke-static {p0, p1, v3}, Lcom/wrapper/proxyapplication/MultiDex;->access$500(Ljava/lang/Object;Ljava/lang/String;[Ljava/lang/Object;)V

    const-string p1, "mZips"

    .line 1033
    invoke-static {p0, p1, v4}, Lcom/wrapper/proxyapplication/MultiDex;->access$500(Ljava/lang/Object;Ljava/lang/String;[Ljava/lang/Object;)V

    const-string p1, "mDexs"

    .line 1034
    invoke-static {p0, p1, v0}, Lcom/wrapper/proxyapplication/MultiDex;->access$500(Ljava/lang/Object;Ljava/lang/String;[Ljava/lang/Object;)V

    .line 1035
    invoke-virtual {v5}, Ljava/util/ArrayList;->size()I

    move-result p0

    if-nez p0, :cond_1

    const/4 p0, 0x0

    return-object p0

    :cond_1
    const/4 p0, 0x1

    .line 1039
    sput p0, Lcom/wrapper/proxyapplication/MultiDex;->hasInjected:I

    return-object v5
.end method

.method private static install(Ljava/lang/ClassLoader;Ljava/lang/reflect/Field;Ljava/util/List;Ljava/io/File;I)Ljava/util/ArrayList;
    .locals 16
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "(",
            "Ljava/lang/ClassLoader;",
            "Ljava/lang/reflect/Field;",
            "Ljava/util/List<",
            "Ljava/io/File;",
            ">;",
            "Ljava/io/File;",
            "I)",
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
            Ljava/io/IOException;
        }
    .end annotation

    move-object/from16 v0, p0

    move-object/from16 v1, p1

    move/from16 v2, p4

    .line 1051
    invoke-interface/range {p2 .. p2}, Ljava/util/List;->size()I

    move-result v3

    .line 1055
    new-instance v4, Ljava/lang/StringBuilder;

    invoke-virtual {v1, v0}, Ljava/lang/reflect/Field;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v5

    check-cast v5, Ljava/lang/String;

    invoke-direct {v4, v5}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    .line 1056
    new-array v5, v3, [Ljava/lang/String;

    .line 1057
    new-array v6, v3, [Ljava/io/File;

    .line 1058
    new-array v7, v3, [Ljava/util/zip/ZipFile;

    .line 1059
    new-array v3, v3, [Ldalvik/system/DexFile;

    .line 1061
    new-instance v8, Ljava/util/ArrayList;

    invoke-direct {v8}, Ljava/util/ArrayList;-><init>()V

    .line 1063
    invoke-interface/range {p2 .. p2}, Ljava/util/List;->listIterator()Ljava/util/ListIterator;

    move-result-object v9

    :goto_0
    invoke-interface {v9}, Ljava/util/ListIterator;->hasNext()Z

    move-result v10

    if-eqz v10, :cond_0

    .line 1064
    invoke-interface {v9}, Ljava/util/ListIterator;->next()Ljava/lang/Object;

    move-result-object v10

    check-cast v10, Ljava/io/File;

    .line 1065
    invoke-virtual {v10}, Ljava/io/File;->getAbsolutePath()Ljava/lang/String;

    move-result-object v11

    .line 1066
    invoke-virtual/range {p3 .. p3}, Ljava/io/File;->getAbsolutePath()Ljava/lang/String;

    move-result-object v12

    .line 1067
    invoke-static {v11}, Lcom/wrapper/proxyapplication/MultiDex;->access$800(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v13

    const/16 v14, 0x3a

    .line 1068
    invoke-virtual {v4, v14}, Ljava/lang/StringBuilder;->append(C)Ljava/lang/StringBuilder;

    invoke-virtual {v4, v11}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 1069
    invoke-interface {v9}, Ljava/util/ListIterator;->previousIndex()I

    move-result v14

    .line 1070
    aput-object v11, v5, v14

    .line 1071
    aput-object v10, v6, v14

    .line 1072
    new-instance v15, Ljava/util/zip/ZipFile;

    invoke-direct {v15, v10}, Ljava/util/zip/ZipFile;-><init>(Ljava/io/File;)V

    aput-object v15, v7, v14

    .line 1073
    new-instance v10, Ljava/lang/StringBuilder;

    invoke-direct {v10}, Ljava/lang/StringBuilder;-><init>()V

    invoke-virtual {v10, v12}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string v12, "/"

    invoke-virtual {v10, v12}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v10, v13}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string v12, ".dex"

    invoke-virtual {v10, v12}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v10}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v10

    const/4 v12, 0x0

    invoke-static {v11, v10, v12}, Ldalvik/system/DexFile;->loadDex(Ljava/lang/String;Ljava/lang/String;I)Ldalvik/system/DexFile;

    move-result-object v10

    aput-object v10, v3, v14

    .line 1074
    aget-object v10, v3, v14

    const-string v11, "mCookie"

    invoke-static {v10, v11}, Lcom/wrapper/proxyapplication/MultiDex;->access$400(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v10

    .line 1075
    aget-object v11, v3, v14

    invoke-virtual {v10, v11}, Ljava/lang/reflect/Field;->getInt(Ljava/lang/Object;)I

    move-result v10

    invoke-static {v10}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v10

    .line 1077
    invoke-virtual {v8, v10}, Ljava/util/ArrayList;->add(Ljava/lang/Object;)Z

    goto :goto_0

    .line 1080
    :cond_0
    invoke-virtual {v4}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v4

    invoke-virtual {v1, v0, v4}, Ljava/lang/reflect/Field;->set(Ljava/lang/Object;Ljava/lang/Object;)V

    const-string v1, "mPaths"

    .line 1081
    invoke-static {v0, v1, v5, v2}, Lcom/wrapper/proxyapplication/MultiDex;->access$600(Ljava/lang/Object;Ljava/lang/String;[Ljava/lang/Object;I)V

    const-string v1, "mFiles"

    .line 1082
    invoke-static {v0, v1, v6, v2}, Lcom/wrapper/proxyapplication/MultiDex;->access$600(Ljava/lang/Object;Ljava/lang/String;[Ljava/lang/Object;I)V

    const-string v1, "mZips"

    .line 1083
    invoke-static {v0, v1, v7, v2}, Lcom/wrapper/proxyapplication/MultiDex;->access$600(Ljava/lang/Object;Ljava/lang/String;[Ljava/lang/Object;I)V

    const-string v1, "mDexs"

    .line 1084
    invoke-static {v0, v1, v3, v2}, Lcom/wrapper/proxyapplication/MultiDex;->access$600(Ljava/lang/Object;Ljava/lang/String;[Ljava/lang/Object;I)V

    .line 1085
    invoke-virtual {v8}, Ljava/util/ArrayList;->size()I

    move-result v0

    if-nez v0, :cond_1

    const/4 v0, 0x0

    return-object v0

    :cond_1
    return-object v8
.end method
