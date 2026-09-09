.class final Lcom/wrapper/proxyapplication/MultiDexForTinker$V4;
.super Ljava/lang/Object;
.source "MultiDexForTinker.java"


# annotations
.annotation system Ldalvik/annotation/EnclosingClass;
    value = Lcom/wrapper/proxyapplication/MultiDexForTinker;
.end annotation

.annotation system Ldalvik/annotation/InnerClass;
    accessFlags = 0x1a
    name = "V4"
.end annotation


# direct methods
.method private constructor <init>()V
    .locals 0

    .prologue
    .line 1120
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
            Ljava/io/IOException;
        }
    .end annotation

    .prologue
    .line 1121
    invoke-static {p0, p1, p2, p3}, Lcom/wrapper/proxyapplication/MultiDexForTinker$V4;->install(Ljava/lang/ClassLoader;Ljava/lang/reflect/Field;Ljava/util/List;Ljava/io/File;)Ljava/util/ArrayList;

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
            Ljava/io/IOException;
        }
    .end annotation

    .prologue
    .line 1173
    invoke-static {p0, p1, p2, p3, p4}, Lcom/wrapper/proxyapplication/MultiDexForTinker$V4;->install(Ljava/lang/ClassLoader;Ljava/lang/reflect/Field;Ljava/util/List;Ljava/io/File;I)Ljava/util/ArrayList;

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
            Ljava/io/IOException;
        }
    .end annotation

    .prologue
    .line 1129
    .local p2, "additionalClassPathEntries":Ljava/util/List;, "Ljava/util/List<Ljava/io/File;>;"
    invoke-interface/range {p2 .. p2}, Ljava/util/List;->size()I

    move-result v9

    .line 1130
    .local v9, "extraSize":I
    const/4 v14, 0x0

    .line 1133
    .local v14, "objcookielist":Ljava/util/ArrayList;, "Ljava/util/ArrayList<Ljava/lang/Object;>;"
    new-instance v17, Ljava/lang/StringBuilder;

    move-object/from16 v0, p1

    move-object/from16 v1, p0

    invoke-virtual {v0, v1}, Ljava/lang/reflect/Field;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v18

    check-cast v18, Ljava/lang/String;

    invoke-direct/range {v17 .. v18}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    .line 1134
    .local v17, "path":Ljava/lang/StringBuilder;
    new-array v8, v9, [Ljava/lang/String;

    .line 1135
    .local v8, "extraPaths":[Ljava/lang/String;
    new-array v7, v9, [Ljava/io/File;

    .line 1136
    .local v7, "extraFiles":[Ljava/io/File;
    new-array v10, v9, [Ljava/util/zip/ZipFile;

    .line 1137
    .local v10, "extraZips":[Ljava/util/zip/ZipFile;
    new-array v6, v9, [Ldalvik/system/DexFile;

    .line 1141
    .local v6, "extraDexs":[Ldalvik/system/DexFile;
    array-length v0, v6

    move/from16 v18, v0

    move/from16 v0, v18

    if-eq v0, v9, :cond_0

    .line 1142
    new-instance v18, Ljava/io/IOException;

    const-string v19, "load dex failed"

    invoke-direct/range {v18 .. v19}, Ljava/io/IOException;-><init>(Ljava/lang/String;)V

    throw v18

    .line 1143
    :cond_0
    new-instance v14, Ljava/util/ArrayList;

    .end local v14    # "objcookielist":Ljava/util/ArrayList;, "Ljava/util/ArrayList<Ljava/lang/Object;>;"
    invoke-direct {v14}, Ljava/util/ArrayList;-><init>()V

    .line 1145
    .restart local v14    # "objcookielist":Ljava/util/ArrayList;, "Ljava/util/ArrayList<Ljava/lang/Object;>;"
    invoke-interface/range {p2 .. p2}, Ljava/util/List;->listIterator()Ljava/util/ListIterator;

    move-result-object v12

    .line 1146
    .local v12, "iterator":Ljava/util/ListIterator;, "Ljava/util/ListIterator<Ljava/io/File;>;"
    :goto_0
    invoke-interface {v12}, Ljava/util/ListIterator;->hasNext()Z

    move-result v18

    if-nez v18, :cond_1

    .line 1163
    invoke-virtual/range {v17 .. v17}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v18

    move-object/from16 v0, p1

    move-object/from16 v1, p0

    move-object/from16 v2, v18

    invoke-virtual {v0, v1, v2}, Ljava/lang/reflect/Field;->set(Ljava/lang/Object;Ljava/lang/Object;)V

    .line 1164
    const-string v18, "mPaths"

    move-object/from16 v0, p0

    move-object/from16 v1, v18

    invoke-static {v0, v1, v8}, Lcom/wrapper/proxyapplication/MultiDexForTinker;->access$1(Ljava/lang/Object;Ljava/lang/String;[Ljava/lang/Object;)V

    .line 1165
    const-string v18, "mFiles"

    move-object/from16 v0, p0

    move-object/from16 v1, v18

    invoke-static {v0, v1, v7}, Lcom/wrapper/proxyapplication/MultiDexForTinker;->access$1(Ljava/lang/Object;Ljava/lang/String;[Ljava/lang/Object;)V

    .line 1166
    const-string v18, "mZips"

    move-object/from16 v0, p0

    move-object/from16 v1, v18

    invoke-static {v0, v1, v10}, Lcom/wrapper/proxyapplication/MultiDexForTinker;->access$1(Ljava/lang/Object;Ljava/lang/String;[Ljava/lang/Object;)V

    .line 1167
    const-string v18, "mDexs"

    move-object/from16 v0, p0

    move-object/from16 v1, v18

    invoke-static {v0, v1, v6}, Lcom/wrapper/proxyapplication/MultiDexForTinker;->access$1(Ljava/lang/Object;Ljava/lang/String;[Ljava/lang/Object;)V

    .line 1168
    const/16 v18, 0x1

    sput v18, Lcom/wrapper/proxyapplication/MultiDexForTinker;->hasInjected:I

    .line 1169
    return-object v14

    .line 1147
    :cond_1
    invoke-interface {v12}, Ljava/util/ListIterator;->next()Ljava/lang/Object;

    move-result-object v3

    check-cast v3, Ljava/io/File;

    .line 1148
    .local v3, "additionalEntry":Ljava/io/File;
    invoke-virtual {v3}, Ljava/io/File;->getAbsolutePath()Ljava/lang/String;

    move-result-object v5

    .line 1149
    .local v5, "entryPath":Ljava/lang/String;
    invoke-virtual/range {p3 .. p3}, Ljava/io/File;->getAbsolutePath()Ljava/lang/String;

    move-result-object v15

    .line 1150
    .local v15, "odexdirPath":Ljava/lang/String;
    invoke-static {v5}, Lcom/wrapper/proxyapplication/MultiDexForTinker;->access$4(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v16

    .line 1151
    .local v16, "odexprefix":Ljava/lang/String;
    const/16 v18, 0x3a

    invoke-virtual/range {v17 .. v18}, Ljava/lang/StringBuilder;->append(C)Ljava/lang/StringBuilder;

    move-result-object v18

    move-object/from16 v0, v18

    invoke-virtual {v0, v5}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 1152
    invoke-interface {v12}, Ljava/util/ListIterator;->previousIndex()I

    move-result v11

    .line 1153
    .local v11, "index":I
    aput-object v5, v8, v11

    .line 1154
    aput-object v3, v7, v11

    .line 1155
    new-instance v18, Ljava/util/zip/ZipFile;

    move-object/from16 v0, v18

    invoke-direct {v0, v3}, Ljava/util/zip/ZipFile;-><init>(Ljava/io/File;)V

    aput-object v18, v10, v11

    .line 1156
    new-instance v18, Ljava/lang/StringBuilder;

    invoke-static {v15}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v19

    invoke-direct/range {v18 .. v19}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v19, "/"

    invoke-virtual/range {v18 .. v19}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v18

    move-object/from16 v0, v18

    move-object/from16 v1, v16

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v18

    const-string v19, ".dex"

    invoke-virtual/range {v18 .. v19}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v18

    invoke-virtual/range {v18 .. v18}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v18

    const/16 v19, 0x0

    move-object/from16 v0, v18

    move/from16 v1, v19

    invoke-static {v5, v0, v1}, Ldalvik/system/DexFile;->loadDex(Ljava/lang/String;Ljava/lang/String;I)Ldalvik/system/DexFile;

    move-result-object v18

    aput-object v18, v6, v11

    .line 1157
    aget-object v18, v6, v11

    const-string v19, "mCookie"

    invoke-static/range {v18 .. v19}, Lcom/wrapper/proxyapplication/MultiDexForTinker;->access$0(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v4

    .line 1158
    .local v4, "cookieField":Ljava/lang/reflect/Field;
    aget-object v18, v6, v11

    move-object/from16 v0, v18

    invoke-virtual {v4, v0}, Ljava/lang/reflect/Field;->getInt(Ljava/lang/Object;)I

    move-result v18

    invoke-static/range {v18 .. v18}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v13

    .line 1160
    .local v13, "mcookie":Ljava/lang/Integer;
    invoke-virtual {v14, v13}, Ljava/util/ArrayList;->add(Ljava/lang/Object;)Z

    goto/16 :goto_0
.end method

.method private static install(Ljava/lang/ClassLoader;Ljava/lang/reflect/Field;Ljava/util/List;Ljava/io/File;I)Ljava/util/ArrayList;
    .locals 20
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
            Ljava/io/IOException;
        }
    .end annotation

    .prologue
    .line 1181
    .local p2, "additionalClassPathEntries":Ljava/util/List;, "Ljava/util/List<Ljava/io/File;>;"
    invoke-interface/range {p2 .. p2}, Ljava/util/List;->size()I

    move-result v9

    .line 1182
    .local v9, "extraSize":I
    const/4 v14, 0x0

    .line 1185
    .local v14, "objcookielist":Ljava/util/ArrayList;, "Ljava/util/ArrayList<Ljava/lang/Object;>;"
    new-instance v17, Ljava/lang/StringBuilder;

    move-object/from16 v0, p1

    move-object/from16 v1, p0

    invoke-virtual {v0, v1}, Ljava/lang/reflect/Field;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v18

    check-cast v18, Ljava/lang/String;

    invoke-direct/range {v17 .. v18}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    .line 1186
    .local v17, "path":Ljava/lang/StringBuilder;
    new-array v8, v9, [Ljava/lang/String;

    .line 1187
    .local v8, "extraPaths":[Ljava/lang/String;
    new-array v7, v9, [Ljava/io/File;

    .line 1188
    .local v7, "extraFiles":[Ljava/io/File;
    new-array v10, v9, [Ljava/util/zip/ZipFile;

    .line 1189
    .local v10, "extraZips":[Ljava/util/zip/ZipFile;
    new-array v6, v9, [Ldalvik/system/DexFile;

    .line 1191
    .local v6, "extraDexs":[Ldalvik/system/DexFile;
    array-length v0, v6

    move/from16 v18, v0

    move/from16 v0, v18

    if-eq v0, v9, :cond_0

    .line 1192
    new-instance v18, Ljava/io/IOException;

    const-string v19, "load dex failed"

    invoke-direct/range {v18 .. v19}, Ljava/io/IOException;-><init>(Ljava/lang/String;)V

    throw v18

    .line 1194
    :cond_0
    new-instance v14, Ljava/util/ArrayList;

    .end local v14    # "objcookielist":Ljava/util/ArrayList;, "Ljava/util/ArrayList<Ljava/lang/Object;>;"
    invoke-direct {v14}, Ljava/util/ArrayList;-><init>()V

    .line 1195
    .restart local v14    # "objcookielist":Ljava/util/ArrayList;, "Ljava/util/ArrayList<Ljava/lang/Object;>;"
    invoke-interface/range {p2 .. p2}, Ljava/util/List;->listIterator()Ljava/util/ListIterator;

    move-result-object v12

    .line 1196
    .local v12, "iterator":Ljava/util/ListIterator;, "Ljava/util/ListIterator<Ljava/io/File;>;"
    :goto_0
    invoke-interface {v12}, Ljava/util/ListIterator;->hasNext()Z

    move-result v18

    if-nez v18, :cond_2

    .line 1213
    invoke-virtual/range {v17 .. v17}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v18

    move-object/from16 v0, p1

    move-object/from16 v1, p0

    move-object/from16 v2, v18

    invoke-virtual {v0, v1, v2}, Ljava/lang/reflect/Field;->set(Ljava/lang/Object;Ljava/lang/Object;)V

    .line 1214
    const-string v18, "mPaths"

    move-object/from16 v0, p0

    move-object/from16 v1, v18

    move/from16 v2, p4

    invoke-static {v0, v1, v8, v2}, Lcom/wrapper/proxyapplication/MultiDexForTinker;->access$2(Ljava/lang/Object;Ljava/lang/String;[Ljava/lang/Object;I)V

    .line 1215
    const-string v18, "mFiles"

    move-object/from16 v0, p0

    move-object/from16 v1, v18

    move/from16 v2, p4

    invoke-static {v0, v1, v7, v2}, Lcom/wrapper/proxyapplication/MultiDexForTinker;->access$2(Ljava/lang/Object;Ljava/lang/String;[Ljava/lang/Object;I)V

    .line 1216
    const-string v18, "mZips"

    move-object/from16 v0, p0

    move-object/from16 v1, v18

    move/from16 v2, p4

    invoke-static {v0, v1, v10, v2}, Lcom/wrapper/proxyapplication/MultiDexForTinker;->access$2(Ljava/lang/Object;Ljava/lang/String;[Ljava/lang/Object;I)V

    .line 1217
    const-string v18, "mDexs"

    move-object/from16 v0, p0

    move-object/from16 v1, v18

    move/from16 v2, p4

    invoke-static {v0, v1, v6, v2}, Lcom/wrapper/proxyapplication/MultiDexForTinker;->access$2(Ljava/lang/Object;Ljava/lang/String;[Ljava/lang/Object;I)V

    .line 1218
    const/16 v18, 0x1

    sput v18, Lcom/wrapper/proxyapplication/MultiDexForTinker;->hasInjected:I

    .line 1219
    invoke-virtual {v14}, Ljava/util/ArrayList;->size()I

    move-result v18

    if-nez v18, :cond_1

    .line 1221
    const/4 v14, 0x0

    .line 1223
    .end local v14    # "objcookielist":Ljava/util/ArrayList;, "Ljava/util/ArrayList<Ljava/lang/Object;>;"
    :cond_1
    return-object v14

    .line 1197
    .restart local v14    # "objcookielist":Ljava/util/ArrayList;, "Ljava/util/ArrayList<Ljava/lang/Object;>;"
    :cond_2
    invoke-interface {v12}, Ljava/util/ListIterator;->next()Ljava/lang/Object;

    move-result-object v3

    check-cast v3, Ljava/io/File;

    .line 1198
    .local v3, "additionalEntry":Ljava/io/File;
    invoke-virtual {v3}, Ljava/io/File;->getAbsolutePath()Ljava/lang/String;

    move-result-object v5

    .line 1199
    .local v5, "entryPath":Ljava/lang/String;
    invoke-virtual/range {p3 .. p3}, Ljava/io/File;->getAbsolutePath()Ljava/lang/String;

    move-result-object v15

    .line 1200
    .local v15, "odexdirPath":Ljava/lang/String;
    invoke-static {v5}, Lcom/wrapper/proxyapplication/MultiDexForTinker;->access$4(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v16

    .line 1201
    .local v16, "odexprefix":Ljava/lang/String;
    const/16 v18, 0x3a

    invoke-virtual/range {v17 .. v18}, Ljava/lang/StringBuilder;->append(C)Ljava/lang/StringBuilder;

    move-result-object v18

    move-object/from16 v0, v18

    invoke-virtual {v0, v5}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 1202
    invoke-interface {v12}, Ljava/util/ListIterator;->previousIndex()I

    move-result v11

    .line 1203
    .local v11, "iteIndex":I
    aput-object v5, v8, v11

    .line 1204
    aput-object v3, v7, v11

    .line 1205
    new-instance v18, Ljava/util/zip/ZipFile;

    move-object/from16 v0, v18

    invoke-direct {v0, v3}, Ljava/util/zip/ZipFile;-><init>(Ljava/io/File;)V

    aput-object v18, v10, v11

    .line 1206
    new-instance v18, Ljava/lang/StringBuilder;

    invoke-static {v15}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v19

    invoke-direct/range {v18 .. v19}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v19, "/"

    invoke-virtual/range {v18 .. v19}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v18

    move-object/from16 v0, v18

    move-object/from16 v1, v16

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v18

    const-string v19, ".dex"

    invoke-virtual/range {v18 .. v19}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v18

    invoke-virtual/range {v18 .. v18}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v18

    const/16 v19, 0x0

    move-object/from16 v0, v18

    move/from16 v1, v19

    invoke-static {v5, v0, v1}, Ldalvik/system/DexFile;->loadDex(Ljava/lang/String;Ljava/lang/String;I)Ldalvik/system/DexFile;

    move-result-object v18

    aput-object v18, v6, v11

    .line 1207
    aget-object v18, v6, v11

    const-string v19, "mCookie"

    invoke-static/range {v18 .. v19}, Lcom/wrapper/proxyapplication/MultiDexForTinker;->access$0(Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v4

    .line 1208
    .local v4, "cookieField":Ljava/lang/reflect/Field;
    aget-object v18, v6, v11

    move-object/from16 v0, v18

    invoke-virtual {v4, v0}, Ljava/lang/reflect/Field;->getInt(Ljava/lang/Object;)I

    move-result v18

    invoke-static/range {v18 .. v18}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v13

    .line 1210
    .local v13, "mcookie":Ljava/lang/Integer;
    invoke-virtual {v14, v13}, Ljava/util/ArrayList;->add(Ljava/lang/Object;)Z

    goto/16 :goto_0
.end method
