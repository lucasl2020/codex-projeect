.class final Lcom/wrapper/proxyapplication/MultiDexForTinker$V19;
.super Ljava/lang/Object;
.source "MultiDexForTinker.java"


# annotations
.annotation system Ldalvik/annotation/EnclosingClass;
    value = Lcom/wrapper/proxyapplication/MultiDexForTinker;
.end annotation

.annotation system Ldalvik/annotation/InnerClass;
    accessFlags = 0x1a
    name = "V19"
.end annotation


# direct methods
.method private constructor <init>()V
    .locals 0

    .prologue
    .line 787
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    return-void
.end method

.method static synthetic access$0(Ljava/lang/ClassLoader;Ljava/lang/reflect/Field;Ljava/util/List;Ljava/io/File;)Ljava/util/ArrayList;
    .locals 1
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

    .prologue
    .line 789
    invoke-static {p0, p1, p2, p3}, Lcom/wrapper/proxyapplication/MultiDexForTinker$V19;->install(Ljava/lang/ClassLoader;Ljava/lang/reflect/Field;Ljava/util/List;Ljava/io/File;)Ljava/util/ArrayList;

    move-result-object v0

    return-object v0
.end method

.method static synthetic access$1(Ljava/lang/ClassLoader;Ljava/lang/reflect/Field;Ljava/util/List;Ljava/io/File;I)Ljava/util/ArrayList;
    .locals 1
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

    .prologue
    .line 883
    invoke-static {p0, p1, p2, p3, p4}, Lcom/wrapper/proxyapplication/MultiDexForTinker$V19;->install(Ljava/lang/ClassLoader;Ljava/lang/reflect/Field;Ljava/util/List;Ljava/io/File;I)Ljava/util/ArrayList;

    move-result-object v0

    return-object v0
.end method

.method private static install(Ljava/lang/ClassLoader;Ljava/lang/reflect/Field;Ljava/util/List;Ljava/io/File;)Ljava/util/ArrayList;
    .locals 20
    .param p0, "loader"    # Ljava/lang/ClassLoader;
    .param p1, "pathListField"    # Ljava/lang/reflect/Field;
    .param p3, "optimizedDirectory"    # Ljava/io/File;
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "(",
            "Ljava/lang/ClassLoader;",
            "Ljava/lang/reflect/Field;",
            "Ljava/util/List",
            "<",
            "Ljava/io/File;",
            ">;",
            "Ljava/io/File;",
            ")",
            "Ljava/util/ArrayList",
            "<",
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
            Ljava/lang/NoSuchMethodException;,
            Ljava/io/IOException;
        }
    .end annotation

    .prologue
    .line 799
    .local p2, "additionalClassPathEntries":Ljava/util/List;, "Ljava/util/List<Ljava/io/File;>;"
    const/4 v11, 0x0

    .line 800
    .local v11, "objcookieordexfilelist":Ljava/util/ArrayList;, "Ljava/util/ArrayList<Ljava/lang/Object;>;"
    move-object/from16 v0, p1

    move-object/from16 v1, p0

    invoke-virtual {v0, v1}, Ljava/lang/reflect/Field;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v7

    .line 801
    .local v7, "dexPathList":Ljava/lang/Object;
    new-instance v13, Ljava/util/ArrayList;

    invoke-direct {v13}, Ljava/util/ArrayList;-><init>()V

    .line 803
    .local v13, "suppressedExceptions":Ljava/util/ArrayList;, "Ljava/util/ArrayList<Ljava/io/IOException;>;"
    new-instance v15, Ljava/util/ArrayList;

    move-object/from16 v0, p2

    invoke-direct {v15, v0}, Ljava/util/ArrayList;-><init>(Ljava/util/Collection;)V

    .line 802
    move-object/from16 v0, p3

    invoke-static {v7, v15, v0, v13}, Lcom/wrapper/proxyapplication/MultiDexForTinker$V19;->makeDexElements(Ljava/lang/Object;Ljava/util/ArrayList;Ljava/io/File;Ljava/util/ArrayList;)[Ljava/lang/Object;

    move-result-object v3

    .line 806
    .local v3, "DexElementslist":[Ljava/lang/Object;
    array-length v15, v3

    invoke-interface/range {p2 .. p2}, Ljava/util/List;->size()I

    move-result v16

    move/from16 v0, v16

    if-eq v15, v0, :cond_0

    .line 808
    new-instance v15, Ljava/io/IOException;

    const-string v16, "load dex failed"

    invoke-direct/range {v15 .. v16}, Ljava/io/IOException;-><init>(Ljava/lang/String;)V

    throw v15

    .line 811
    :cond_0
    const/4 v8, 0x0

    .line 812
    .local v8, "dexfileField":Ljava/lang/reflect/Field;
    const/4 v5, 0x0

    .line 814
    .local v5, "cookieField":Ljava/lang/reflect/Field;
    new-instance v11, Ljava/util/ArrayList;

    .end local v11    # "objcookieordexfilelist":Ljava/util/ArrayList;, "Ljava/util/ArrayList<Ljava/lang/Object;>;"
    invoke-direct {v11}, Ljava/util/ArrayList;-><init>()V

    .line 816
    .restart local v11    # "objcookieordexfilelist":Ljava/util/ArrayList;, "Ljava/util/ArrayList<Ljava/lang/Object;>;"
    array-length v0, v3

    move/from16 v16, v0

    const/4 v15, 0x0

    :goto_0
    move/from16 v0, v16

    if-lt v15, v0, :cond_2

    .line 852
    const-string v15, "dexElements"

    invoke-static {v7, v15, v3}, Lcom/wrapper/proxyapplication/MultiDexForTinker;->access$1(Ljava/lang/Object;Ljava/lang/String;[Ljava/lang/Object;)V

    .line 853
    invoke-virtual {v13}, Ljava/util/ArrayList;->size()I

    move-result v15

    if-lez v15, :cond_1

    .line 854
    invoke-virtual {v13}, Ljava/util/ArrayList;->iterator()Ljava/util/Iterator;

    move-result-object v15

    :goto_1
    invoke-interface {v15}, Ljava/util/Iterator;->hasNext()Z

    move-result v16

    if-nez v16, :cond_5

    .line 858
    const-string v15, "dexElementsSuppressedExceptions"

    invoke-static {v7, v15}, Lcom/wrapper/proxyapplication/MultiDexForTinker;->access$0(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v14

    .line 860
    .local v14, "suppressedExceptionsField":Ljava/lang/reflect/Field;
    invoke-virtual {v14, v7}, Ljava/lang/reflect/Field;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v6

    check-cast v6, [Ljava/io/IOException;

    .line 862
    .local v6, "dexElementsSuppressedExceptions":[Ljava/io/IOException;
    if-nez v6, :cond_6

    .line 865
    invoke-virtual {v13}, Ljava/util/ArrayList;->size()I

    move-result v15

    new-array v15, v15, [Ljava/io/IOException;

    .line 864
    invoke-virtual {v13, v15}, Ljava/util/ArrayList;->toArray([Ljava/lang/Object;)[Ljava/lang/Object;

    move-result-object v6

    .end local v6    # "dexElementsSuppressedExceptions":[Ljava/io/IOException;
    check-cast v6, [Ljava/io/IOException;

    .line 876
    .restart local v6    # "dexElementsSuppressedExceptions":[Ljava/io/IOException;
    :goto_2
    invoke-virtual {v14, v7, v6}, Ljava/lang/reflect/Field;->set(Ljava/lang/Object;Ljava/lang/Object;)V

    .line 879
    .end local v6    # "dexElementsSuppressedExceptions":[Ljava/io/IOException;
    .end local v14    # "suppressedExceptionsField":Ljava/lang/reflect/Field;
    :cond_1
    const/4 v15, 0x1

    sput v15, Lcom/wrapper/proxyapplication/MultiDexForTinker;->hasInjected:I

    .line 880
    return-object v11

    .line 816
    :cond_2
    aget-object v2, v3, v15

    .line 818
    .local v2, "DexElements":Ljava/lang/Object;
    const-string v17, "dexFile"

    move-object/from16 v0, v17

    invoke-static {v2, v0}, Lcom/wrapper/proxyapplication/MultiDexForTinker;->access$0(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v8

    .line 819
    invoke-virtual {v8, v2}, Ljava/lang/reflect/Field;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v12

    .line 823
    .local v12, "objdexfile":Ljava/lang/Object;
    const-string v17, "mCookie"

    move-object/from16 v0, v17

    invoke-static {v12, v0}, Lcom/wrapper/proxyapplication/MultiDexForTinker;->access$0(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v5

    .line 826
    invoke-virtual {v5}, Ljava/lang/reflect/Field;->getType()Ljava/lang/Class;

    move-result-object v17

    invoke-virtual/range {v17 .. v17}, Ljava/lang/Class;->getName()Ljava/lang/String;

    move-result-object v17

    const-string v18, "int"

    invoke-virtual/range {v17 .. v18}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v17

    if-eqz v17, :cond_3

    .line 829
    invoke-virtual {v5, v12}, Ljava/lang/reflect/Field;->getInt(Ljava/lang/Object;)I

    move-result v17

    invoke-static/range {v17 .. v17}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v10

    .line 830
    .local v10, "mcookie":Ljava/lang/Integer;
    invoke-virtual {v11, v10}, Ljava/util/ArrayList;->add(Ljava/lang/Object;)Z

    .line 816
    .end local v10    # "mcookie":Ljava/lang/Integer;
    :goto_3
    add-int/lit8 v15, v15, 0x1

    goto :goto_0

    .line 834
    :cond_3
    invoke-virtual {v5}, Ljava/lang/reflect/Field;->getType()Ljava/lang/Class;

    move-result-object v17

    invoke-virtual/range {v17 .. v17}, Ljava/lang/Class;->getName()Ljava/lang/String;

    move-result-object v17

    const-string v18, "long"

    invoke-virtual/range {v17 .. v18}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v17

    if-eqz v17, :cond_4

    .line 838
    invoke-virtual {v5, v12}, Ljava/lang/reflect/Field;->getLong(Ljava/lang/Object;)J

    move-result-wide v18

    invoke-static/range {v18 .. v19}, Ljava/lang/Long;->valueOf(J)Ljava/lang/Long;

    move-result-object v10

    .line 839
    .local v10, "mcookie":Ljava/lang/Long;
    invoke-virtual {v11, v10}, Ljava/util/ArrayList;->add(Ljava/lang/Object;)Z

    goto :goto_3

    .line 847
    .end local v10    # "mcookie":Ljava/lang/Long;
    :cond_4
    invoke-virtual {v11, v12}, Ljava/util/ArrayList;->add(Ljava/lang/Object;)Z

    goto :goto_3

    .line 854
    .end local v2    # "DexElements":Ljava/lang/Object;
    .end local v12    # "objdexfile":Ljava/lang/Object;
    :cond_5
    invoke-interface {v15}, Ljava/util/Iterator;->next()Ljava/lang/Object;

    move-result-object v9

    check-cast v9, Ljava/io/IOException;

    .line 855
    .local v9, "e":Ljava/io/IOException;
    goto/16 :goto_1

    .line 868
    .end local v9    # "e":Ljava/io/IOException;
    .restart local v6    # "dexElementsSuppressedExceptions":[Ljava/io/IOException;
    .restart local v14    # "suppressedExceptionsField":Ljava/lang/reflect/Field;
    :cond_6
    invoke-virtual {v13}, Ljava/util/ArrayList;->size()I

    move-result v15

    .line 869
    array-length v0, v6

    move/from16 v16, v0

    .line 868
    add-int v15, v15, v16

    new-array v4, v15, [Ljava/io/IOException;

    .line 870
    .local v4, "combined":[Ljava/io/IOException;
    invoke-virtual {v13, v4}, Ljava/util/ArrayList;->toArray([Ljava/lang/Object;)[Ljava/lang/Object;

    .line 871
    const/4 v15, 0x0

    .line 872
    invoke-virtual {v13}, Ljava/util/ArrayList;->size()I

    move-result v16

    array-length v0, v6

    move/from16 v17, v0

    .line 871
    move/from16 v0, v16

    move/from16 v1, v17

    invoke-static {v6, v15, v4, v0, v1}, Ljava/lang/System;->arraycopy(Ljava/lang/Object;ILjava/lang/Object;II)V

    .line 873
    move-object v6, v4

    goto/16 :goto_2
.end method

.method private static install(Ljava/lang/ClassLoader;Ljava/lang/reflect/Field;Ljava/util/List;Ljava/io/File;I)Ljava/util/ArrayList;
    .locals 18
    .param p0, "loader"    # Ljava/lang/ClassLoader;
    .param p1, "pathListField"    # Ljava/lang/reflect/Field;
    .param p3, "optimizedDirectory"    # Ljava/io/File;
    .param p4, "index"    # I
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "(",
            "Ljava/lang/ClassLoader;",
            "Ljava/lang/reflect/Field;",
            "Ljava/util/List",
            "<",
            "Ljava/io/File;",
            ">;",
            "Ljava/io/File;",
            "I)",
            "Ljava/util/ArrayList",
            "<",
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
            Ljava/lang/NoSuchMethodException;,
            Ljava/io/IOException;
        }
    .end annotation

    .prologue
    .line 893
    .local p2, "additionalClassPathEntries":Ljava/util/List;, "Ljava/util/List<Ljava/io/File;>;"
    const/4 v10, 0x0

    .line 894
    .local v10, "objcookieordexfilelist":Ljava/util/ArrayList;, "Ljava/util/ArrayList<Ljava/lang/Object;>;"
    move-object/from16 v0, p1

    move-object/from16 v1, p0

    invoke-virtual {v0, v1}, Ljava/lang/reflect/Field;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v6

    .line 895
    .local v6, "dexPathList":Ljava/lang/Object;
    new-instance v12, Ljava/util/ArrayList;

    invoke-direct {v12}, Ljava/util/ArrayList;-><init>()V

    .line 897
    .local v12, "suppressedExceptions":Ljava/util/ArrayList;, "Ljava/util/ArrayList<Ljava/io/IOException;>;"
    new-instance v14, Ljava/util/ArrayList;

    move-object/from16 v0, p2

    invoke-direct {v14, v0}, Ljava/util/ArrayList;-><init>(Ljava/util/Collection;)V

    .line 896
    move-object/from16 v0, p3

    invoke-static {v6, v14, v0, v12}, Lcom/wrapper/proxyapplication/MultiDexForTinker$V19;->makeDexElements(Ljava/lang/Object;Ljava/util/ArrayList;Ljava/io/File;Ljava/util/ArrayList;)[Ljava/lang/Object;

    move-result-object v3

    .line 900
    .local v3, "DexElementslist":[Ljava/lang/Object;
    array-length v14, v3

    invoke-interface/range {p2 .. p2}, Ljava/util/List;->size()I

    move-result v15

    if-eq v14, v15, :cond_0

    .line 902
    new-instance v14, Ljava/io/IOException;

    const-string v15, "load dex failed"

    invoke-direct {v14, v15}, Ljava/io/IOException;-><init>(Ljava/lang/String;)V

    throw v14

    .line 906
    :cond_0
    const/4 v7, 0x0

    .line 907
    .local v7, "dexfileField":Ljava/lang/reflect/Field;
    const/4 v5, 0x0

    .line 909
    .local v5, "cookieField":Ljava/lang/reflect/Field;
    new-instance v10, Ljava/util/ArrayList;

    .end local v10    # "objcookieordexfilelist":Ljava/util/ArrayList;, "Ljava/util/ArrayList<Ljava/lang/Object;>;"
    invoke-direct {v10}, Ljava/util/ArrayList;-><init>()V

    .line 910
    .restart local v10    # "objcookieordexfilelist":Ljava/util/ArrayList;, "Ljava/util/ArrayList<Ljava/lang/Object;>;"
    array-length v15, v3

    const/4 v14, 0x0

    :goto_0
    if-lt v14, v15, :cond_2

    .line 966
    const-string v14, "dexElements"

    move/from16 v0, p4

    invoke-static {v6, v14, v3, v0}, Lcom/wrapper/proxyapplication/MultiDexForTinker;->access$2(Ljava/lang/Object;Ljava/lang/String;[Ljava/lang/Object;I)V

    .line 967
    invoke-virtual {v12}, Ljava/util/ArrayList;->size()I

    move-result v14

    if-lez v14, :cond_1

    .line 968
    invoke-virtual {v12}, Ljava/util/ArrayList;->iterator()Ljava/util/Iterator;

    move-result-object v14

    :goto_1
    invoke-interface {v14}, Ljava/util/Iterator;->hasNext()Z

    move-result v15

    if-nez v15, :cond_5

    .line 972
    const-string v14, "dexElementsSuppressedExceptions"

    invoke-static {v6, v14}, Lcom/wrapper/proxyapplication/MultiDexForTinker;->access$0(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v13

    .line 974
    .local v13, "suppressedExceptionsField":Ljava/lang/reflect/Field;
    invoke-virtual {v13, v6}, Ljava/lang/reflect/Field;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v14

    check-cast v14, [Ljava/io/IOException;

    .line 973
    sput-object v14, Lcom/wrapper/proxyapplication/MultiDexForTinker;->dexElementsSuppressedExceptions:[Ljava/io/IOException;

    .line 976
    sget-object v14, Lcom/wrapper/proxyapplication/MultiDexForTinker;->dexElementsSuppressedExceptions:[Ljava/io/IOException;

    if-nez v14, :cond_6

    .line 979
    invoke-virtual {v12}, Ljava/util/ArrayList;->size()I

    move-result v14

    new-array v14, v14, [Ljava/io/IOException;

    .line 978
    invoke-virtual {v12, v14}, Ljava/util/ArrayList;->toArray([Ljava/lang/Object;)[Ljava/lang/Object;

    move-result-object v14

    check-cast v14, [Ljava/io/IOException;

    .line 977
    sput-object v14, Lcom/wrapper/proxyapplication/MultiDexForTinker;->dexElementsSuppressedExceptions:[Ljava/io/IOException;

    .line 993
    .end local v13    # "suppressedExceptionsField":Ljava/lang/reflect/Field;
    :cond_1
    :goto_2
    const/4 v14, 0x1

    sput v14, Lcom/wrapper/proxyapplication/MultiDexForTinker;->hasInjected:I

    .line 994
    return-object v10

    .line 910
    :cond_2
    aget-object v2, v3, v14

    .line 912
    .local v2, "DexElements":Ljava/lang/Object;
    const-string v16, "dexFile"

    move-object/from16 v0, v16

    invoke-static {v2, v0}, Lcom/wrapper/proxyapplication/MultiDexForTinker;->access$0(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v7

    .line 913
    invoke-virtual {v7, v2}, Ljava/lang/reflect/Field;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v11

    .line 917
    .local v11, "objdexfile":Ljava/lang/Object;
    const-string v16, "mCookie"

    move-object/from16 v0, v16

    invoke-static {v11, v0}, Lcom/wrapper/proxyapplication/MultiDexForTinker;->access$0(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v5

    .line 920
    invoke-virtual {v5}, Ljava/lang/reflect/Field;->getType()Ljava/lang/Class;

    move-result-object v16

    invoke-virtual/range {v16 .. v16}, Ljava/lang/Class;->getName()Ljava/lang/String;

    move-result-object v16

    const-string v17, "int"

    invoke-virtual/range {v16 .. v17}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v16

    if-eqz v16, :cond_3

    .line 923
    invoke-virtual {v5, v11}, Ljava/lang/reflect/Field;->getInt(Ljava/lang/Object;)I

    move-result v16

    invoke-static/range {v16 .. v16}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v9

    .line 924
    .local v9, "mcookie":Ljava/lang/Integer;
    invoke-virtual {v10, v9}, Ljava/util/ArrayList;->add(Ljava/lang/Object;)Z

    .line 910
    .end local v9    # "mcookie":Ljava/lang/Integer;
    :goto_3
    add-int/lit8 v14, v14, 0x1

    goto :goto_0

    .line 928
    :cond_3
    invoke-virtual {v5}, Ljava/lang/reflect/Field;->getType()Ljava/lang/Class;

    move-result-object v16

    invoke-virtual/range {v16 .. v16}, Ljava/lang/Class;->getName()Ljava/lang/String;

    move-result-object v16

    const-string v17, "long"

    invoke-virtual/range {v16 .. v17}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v16

    if-eqz v16, :cond_4

    .line 932
    invoke-virtual {v5, v11}, Ljava/lang/reflect/Field;->getLong(Ljava/lang/Object;)J

    move-result-wide v16

    invoke-static/range {v16 .. v17}, Ljava/lang/Long;->valueOf(J)Ljava/lang/Long;

    move-result-object v9

    .line 933
    .local v9, "mcookie":Ljava/lang/Long;
    invoke-virtual {v10, v9}, Ljava/util/ArrayList;->add(Ljava/lang/Object;)Z

    goto :goto_3

    .line 943
    .end local v9    # "mcookie":Ljava/lang/Long;
    :cond_4
    invoke-virtual {v10, v11}, Ljava/util/ArrayList;->add(Ljava/lang/Object;)Z

    goto :goto_3

    .line 968
    .end local v2    # "DexElements":Ljava/lang/Object;
    .end local v11    # "objdexfile":Ljava/lang/Object;
    :cond_5
    invoke-interface {v14}, Ljava/util/Iterator;->next()Ljava/lang/Object;

    move-result-object v8

    check-cast v8, Ljava/io/IOException;

    .line 969
    .local v8, "e":Ljava/io/IOException;
    goto/16 :goto_1

    .line 982
    .end local v8    # "e":Ljava/io/IOException;
    .restart local v13    # "suppressedExceptionsField":Ljava/lang/reflect/Field;
    :cond_6
    invoke-virtual {v12}, Ljava/util/ArrayList;->size()I

    move-result v14

    .line 983
    sget-object v15, Lcom/wrapper/proxyapplication/MultiDexForTinker;->dexElementsSuppressedExceptions:[Ljava/io/IOException;

    array-length v15, v15

    .line 982
    add-int/2addr v14, v15

    new-array v4, v14, [Ljava/io/IOException;

    .line 984
    .local v4, "combined":[Ljava/io/IOException;
    invoke-virtual {v12, v4}, Ljava/util/ArrayList;->toArray([Ljava/lang/Object;)[Ljava/lang/Object;

    .line 985
    sget-object v14, Lcom/wrapper/proxyapplication/MultiDexForTinker;->dexElementsSuppressedExceptions:[Ljava/io/IOException;

    const/4 v15, 0x0

    .line 986
    invoke-virtual {v12}, Ljava/util/ArrayList;->size()I

    move-result v16

    sget-object v17, Lcom/wrapper/proxyapplication/MultiDexForTinker;->dexElementsSuppressedExceptions:[Ljava/io/IOException;

    move-object/from16 v0, v17

    array-length v0, v0

    move/from16 v17, v0

    .line 985
    move/from16 v0, v16

    move/from16 v1, v17

    invoke-static {v14, v15, v4, v0, v1}, Ljava/lang/System;->arraycopy(Ljava/lang/Object;ILjava/lang/Object;II)V

    .line 987
    sput-object v4, Lcom/wrapper/proxyapplication/MultiDexForTinker;->dexElementsSuppressedExceptions:[Ljava/io/IOException;

    goto/16 :goto_2
.end method

.method private static makeDexElements(Ljava/lang/Object;Ljava/util/ArrayList;Ljava/io/File;Ljava/util/ArrayList;)[Ljava/lang/Object;
    .locals 8
    .param p0, "dexPathList"    # Ljava/lang/Object;
    .param p2, "optimizedDirectory"    # Ljava/io/File;
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "(",
            "Ljava/lang/Object;",
            "Ljava/util/ArrayList",
            "<",
            "Ljava/io/File;",
            ">;",
            "Ljava/io/File;",
            "Ljava/util/ArrayList",
            "<",
            "Ljava/io/IOException;",
            ">;)[",
            "Ljava/lang/Object;"
        }
    .end annotation

    .prologue
    .line 1005
    .local p1, "files":Ljava/util/ArrayList;, "Ljava/util/ArrayList<Ljava/io/File;>;"
    .local p3, "suppressedExceptions":Ljava/util/ArrayList;, "Ljava/util/ArrayList<Ljava/io/IOException;>;"
    const/4 v3, 0x0

    .line 1007
    .local v3, "makeDexElements":Ljava/lang/reflect/Method;
    :try_start_0
    const-string v4, "makeDexElements"

    const/4 v5, 0x2

    new-array v5, v5, [Ljava/lang/Class;

    const/4 v6, 0x0

    const-class v7, Ljava/util/ArrayList;

    aput-object v7, v5, v6

    const/4 v6, 0x1

    const-class v7, Ljava/io/File;

    aput-object v7, v5, v6

    invoke-static {p0, v4, v5}, Lcom/wrapper/proxyapplication/MultiDexForTinker;->access$3(Ljava/lang/Object;Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;
    :try_end_0
    .catch Ljava/lang/NoSuchMethodException; {:try_start_0 .. :try_end_0} :catch_2

    move-result-object v3

    .line 1009
    const/4 v4, 0x2

    :try_start_1
    new-array v4, v4, [Ljava/lang/Object;

    const/4 v5, 0x0

    aput-object p1, v4, v5

    const/4 v5, 0x1

    aput-object p2, v4, v5

    invoke-virtual {v3, p0, v4}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v4

    check-cast v4, [Ljava/lang/Object;
    :try_end_1
    .catch Ljava/lang/IllegalAccessException; {:try_start_1 .. :try_end_1} :catch_0
    .catch Ljava/lang/IllegalArgumentException; {:try_start_1 .. :try_end_1} :catch_1
    .catch Ljava/lang/reflect/InvocationTargetException; {:try_start_1 .. :try_end_1} :catch_3
    .catch Ljava/lang/RuntimeException; {:try_start_1 .. :try_end_1} :catch_4
    .catch Ljava/lang/NoSuchMethodException; {:try_start_1 .. :try_end_1} :catch_2

    .line 1076
    :goto_0
    return-object v4

    .line 1010
    :catch_0
    move-exception v0

    .line 1012
    .local v0, "e":Ljava/lang/IllegalAccessException;
    :try_start_2
    invoke-virtual {v0}, Ljava/lang/IllegalAccessException;->printStackTrace()V

    .line 1076
    .end local v0    # "e":Ljava/lang/IllegalAccessException;
    :goto_1
    const/4 v4, 0x0

    goto :goto_0

    .line 1013
    :catch_1
    move-exception v0

    .line 1015
    .local v0, "e":Ljava/lang/IllegalArgumentException;
    invoke-virtual {v0}, Ljava/lang/IllegalArgumentException;->printStackTrace()V
    :try_end_2
    .catch Ljava/lang/NoSuchMethodException; {:try_start_2 .. :try_end_2} :catch_2

    goto :goto_1

    .line 1023
    .end local v0    # "e":Ljava/lang/IllegalArgumentException;
    :catch_2
    move-exception v0

    .line 1026
    .local v0, "e":Ljava/lang/NoSuchMethodException;
    :try_start_3
    const-string v4, "makeDexElements"

    const/4 v5, 0x3

    new-array v5, v5, [Ljava/lang/Class;

    const/4 v6, 0x0

    const-class v7, Ljava/util/ArrayList;

    aput-object v7, v5, v6

    const/4 v6, 0x1

    const-class v7, Ljava/io/File;

    aput-object v7, v5, v6

    const/4 v6, 0x2

    const-class v7, Ljava/util/ArrayList;

    aput-object v7, v5, v6

    invoke-static {p0, v4, v5}, Lcom/wrapper/proxyapplication/MultiDexForTinker;->access$3(Ljava/lang/Object;Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;
    :try_end_3
    .catch Ljava/lang/NoSuchMethodException; {:try_start_3 .. :try_end_3} :catch_7

    move-result-object v3

    .line 1028
    const/4 v4, 0x3

    :try_start_4
    new-array v4, v4, [Ljava/lang/Object;

    const/4 v5, 0x0

    aput-object p1, v4, v5

    const/4 v5, 0x1

    aput-object p2, v4, v5

    const/4 v5, 0x2

    .line 1029
    aput-object p3, v4, v5

    .line 1028
    invoke-virtual {v3, p0, v4}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v4

    check-cast v4, [Ljava/lang/Object;
    :try_end_4
    .catch Ljava/lang/IllegalAccessException; {:try_start_4 .. :try_end_4} :catch_5
    .catch Ljava/lang/IllegalArgumentException; {:try_start_4 .. :try_end_4} :catch_6
    .catch Ljava/lang/reflect/InvocationTargetException; {:try_start_4 .. :try_end_4} :catch_8
    .catch Ljava/lang/RuntimeException; {:try_start_4 .. :try_end_4} :catch_9
    .catch Ljava/lang/NoSuchMethodException; {:try_start_4 .. :try_end_4} :catch_7

    goto :goto_0

    .line 1016
    .end local v0    # "e":Ljava/lang/NoSuchMethodException;
    :catch_3
    move-exception v0

    .line 1018
    .local v0, "e":Ljava/lang/reflect/InvocationTargetException;
    :try_start_5
    invoke-virtual {v0}, Ljava/lang/reflect/InvocationTargetException;->printStackTrace()V

    goto :goto_1

    .line 1019
    .end local v0    # "e":Ljava/lang/reflect/InvocationTargetException;
    :catch_4
    move-exception v0

    .line 1021
    .local v0, "e":Ljava/lang/RuntimeException;
    invoke-virtual {v0}, Ljava/lang/RuntimeException;->printStackTrace()V
    :try_end_5
    .catch Ljava/lang/NoSuchMethodException; {:try_start_5 .. :try_end_5} :catch_2

    goto :goto_1

    .line 1030
    .local v0, "e":Ljava/lang/NoSuchMethodException;
    :catch_5
    move-exception v1

    .line 1032
    .local v1, "e1":Ljava/lang/IllegalAccessException;
    :try_start_6
    invoke-virtual {v1}, Ljava/lang/IllegalAccessException;->printStackTrace()V
    :try_end_6
    .catch Ljava/lang/NoSuchMethodException; {:try_start_6 .. :try_end_6} :catch_7

    .line 1069
    .end local v1    # "e1":Ljava/lang/IllegalAccessException;
    :goto_2
    invoke-virtual {v0}, Ljava/lang/NoSuchMethodException;->printStackTrace()V

    goto :goto_1

    .line 1033
    :catch_6
    move-exception v1

    .line 1035
    .local v1, "e1":Ljava/lang/IllegalArgumentException;
    :try_start_7
    invoke-virtual {v1}, Ljava/lang/IllegalArgumentException;->printStackTrace()V
    :try_end_7
    .catch Ljava/lang/NoSuchMethodException; {:try_start_7 .. :try_end_7} :catch_7

    goto :goto_2

    .line 1043
    .end local v1    # "e1":Ljava/lang/IllegalArgumentException;
    :catch_7
    move-exception v1

    .line 1047
    .local v1, "e1":Ljava/lang/NoSuchMethodException;
    :try_start_8
    const-string v4, "makePathElements"

    const/4 v5, 0x3

    new-array v5, v5, [Ljava/lang/Class;

    const/4 v6, 0x0

    const-class v7, Ljava/util/List;

    aput-object v7, v5, v6

    const/4 v6, 0x1

    const-class v7, Ljava/io/File;

    aput-object v7, v5, v6

    const/4 v6, 0x2

    .line 1048
    const-class v7, Ljava/util/List;

    aput-object v7, v5, v6

    .line 1047
    invoke-static {p0, v4, v5}, Lcom/wrapper/proxyapplication/MultiDexForTinker;->access$3(Ljava/lang/Object;Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;
    :try_end_8
    .catch Ljava/lang/NoSuchMethodException; {:try_start_8 .. :try_end_8} :catch_c

    move-result-object v3

    .line 1050
    const/4 v4, 0x3

    :try_start_9
    new-array v4, v4, [Ljava/lang/Object;

    const/4 v5, 0x0

    aput-object p1, v4, v5

    const/4 v5, 0x1

    aput-object p2, v4, v5

    const/4 v5, 0x2

    .line 1051
    aput-object p3, v4, v5

    .line 1050
    invoke-virtual {v3, p0, v4}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v4

    check-cast v4, [Ljava/lang/Object;
    :try_end_9
    .catch Ljava/lang/IllegalAccessException; {:try_start_9 .. :try_end_9} :catch_a
    .catch Ljava/lang/IllegalArgumentException; {:try_start_9 .. :try_end_9} :catch_b
    .catch Ljava/lang/reflect/InvocationTargetException; {:try_start_9 .. :try_end_9} :catch_d
    .catch Ljava/lang/NoSuchMethodException; {:try_start_9 .. :try_end_9} :catch_c

    goto :goto_0

    .line 1036
    .end local v1    # "e1":Ljava/lang/NoSuchMethodException;
    :catch_8
    move-exception v1

    .line 1038
    .local v1, "e1":Ljava/lang/reflect/InvocationTargetException;
    :try_start_a
    invoke-virtual {v1}, Ljava/lang/reflect/InvocationTargetException;->printStackTrace()V

    goto :goto_2

    .line 1039
    .end local v1    # "e1":Ljava/lang/reflect/InvocationTargetException;
    :catch_9
    move-exception v1

    .line 1041
    .local v1, "e1":Ljava/lang/RuntimeException;
    invoke-virtual {v1}, Ljava/lang/RuntimeException;->printStackTrace()V
    :try_end_a
    .catch Ljava/lang/NoSuchMethodException; {:try_start_a .. :try_end_a} :catch_7

    goto :goto_2

    .line 1052
    .local v1, "e1":Ljava/lang/NoSuchMethodException;
    :catch_a
    move-exception v2

    .line 1054
    .local v2, "e2":Ljava/lang/IllegalAccessException;
    :try_start_b
    invoke-virtual {v2}, Ljava/lang/IllegalAccessException;->printStackTrace()V
    :try_end_b
    .catch Ljava/lang/NoSuchMethodException; {:try_start_b .. :try_end_b} :catch_c

    .line 1067
    .end local v2    # "e2":Ljava/lang/IllegalAccessException;
    :goto_3
    invoke-virtual {v1}, Ljava/lang/NoSuchMethodException;->printStackTrace()V

    goto :goto_2

    .line 1055
    :catch_b
    move-exception v2

    .line 1057
    .local v2, "e2":Ljava/lang/IllegalArgumentException;
    :try_start_c
    invoke-virtual {v2}, Ljava/lang/IllegalArgumentException;->printStackTrace()V
    :try_end_c
    .catch Ljava/lang/NoSuchMethodException; {:try_start_c .. :try_end_c} :catch_c

    goto :goto_3

    .line 1062
    .end local v2    # "e2":Ljava/lang/IllegalArgumentException;
    :catch_c
    move-exception v2

    .line 1064
    .line 1065
    .local v2, "e2":Ljava/lang/NoSuchMethodException;
    invoke-virtual {v2}, Ljava/lang/NoSuchMethodException;->printStackTrace()V

    goto :goto_3

    .line 1058
    .end local v2    # "e2":Ljava/lang/NoSuchMethodException;
    :catch_d
    move-exception v2

    .line 1060
    .local v2, "e2":Ljava/lang/reflect/InvocationTargetException;
    :try_start_d
    invoke-virtual {v2}, Ljava/lang/reflect/InvocationTargetException;->printStackTrace()V
    :try_end_d
    .catch Ljava/lang/NoSuchMethodException; {:try_start_d .. :try_end_d} :catch_c

    goto :goto_3
.end method
