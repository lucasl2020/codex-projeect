.class public Lcom/wrapper/proxyapplication/Util;
.super Ljava/lang/Object;
.source "Util.java"


# static fields
.field public static CPUABI:Ljava/lang/String; = null

.field static final ERROR_EXCEPTION:I = -0x2

.field static final ERROR_FALSE:I = 0x0

.field static final ERROR_FILE_EXIST:I = 0x2

.field static final ERROR_FILE_NOT_FOUND:I = -0x1

.field static final ERROR_FILE_NOT_FOUND_INZIP:I = -0x3

.field static final ERROR_SUCCESS:I = 0x1

.field public static MAX_DEX_NUM:I

.field public static TAG:Ljava/lang/String;

.field public static dexname:Ljava/lang/String;

.field public static ifoverwrite:Z

.field public static libname:Ljava/lang/String;

.field public static securename0:Ljava/lang/String;

.field public static securename1:Ljava/lang/String;

.field public static securename11:Ljava/lang/String;

.field public static securename14:Ljava/lang/String;

.field public static securename15:Ljava/lang/String;

.field public static securename2:Ljava/lang/String;

.field public static securename3:Ljava/lang/String;

.field public static securename4:Ljava/lang/String;

.field public static securename5:Ljava/lang/String;

.field public static securename6:Ljava/lang/String;

.field public static securename7:Ljava/lang/String;

.field public static securename8:Ljava/lang/String;

.field public static securename9:Ljava/lang/String;

.field public static simplelibname:Ljava/lang/String;

.field public static versionname:Ljava/lang/String;


# direct methods
.method static constructor <clinit>()V
    .locals 1

    .prologue
    .line 43
    const/16 v0, 0x12c

    sput v0, Lcom/wrapper/proxyapplication/Util;->MAX_DEX_NUM:I

    .line 44
    const-string v0, "Util"

    sput-object v0, Lcom/wrapper/proxyapplication/Util;->TAG:Ljava/lang/String;

    .line 45
    const/4 v0, 0x0

    sput-object v0, Lcom/wrapper/proxyapplication/Util;->CPUABI:Ljava/lang/String;

    .line 46
    const-string v0, ""

    sput-object v0, Lcom/wrapper/proxyapplication/Util;->libname:Ljava/lang/String;

    .line 47
    const-string v0, "tosprotection"

    sput-object v0, Lcom/wrapper/proxyapplication/Util;->simplelibname:Ljava/lang/String;

    .line 48
    const-string v0, "00O000ll111l.dex"

    sput-object v0, Lcom/wrapper/proxyapplication/Util;->securename0:Ljava/lang/String;

    .line 49
    const-string v0, "00O000ll111l.jar"

    sput-object v0, Lcom/wrapper/proxyapplication/Util;->securename1:Ljava/lang/String;

    .line 50
    const-string v0, "000O00ll111l.dex"

    sput-object v0, Lcom/wrapper/proxyapplication/Util;->securename2:Ljava/lang/String;

    .line 51
    const-string v0, "0000000lllll.dex"

    sput-object v0, Lcom/wrapper/proxyapplication/Util;->securename3:Ljava/lang/String;

    .line 52
    const-string v0, "000000olllll.dex"

    sput-object v0, Lcom/wrapper/proxyapplication/Util;->securename4:Ljava/lang/String;

    .line 55
    const-string v0, "0OO00l111l1l"

    sput-object v0, Lcom/wrapper/proxyapplication/Util;->securename5:Ljava/lang/String;

    .line 56
    const-string v0, "o0oooOO0ooOo.dat"

    sput-object v0, Lcom/wrapper/proxyapplication/Util;->securename6:Ljava/lang/String;

    .line 60
    const-string v0, "exportService.txt"

    sput-object v0, Lcom/wrapper/proxyapplication/Util;->securename7:Ljava/lang/String;

    .line 61
    const-string v0, ".flag00O000ll111l.dex"

    sput-object v0, Lcom/wrapper/proxyapplication/Util;->securename8:Ljava/lang/String;

    .line 62
    const-string v0, ".updateIV.dat"

    sput-object v0, Lcom/wrapper/proxyapplication/Util;->securename9:Ljava/lang/String;

    .line 63
    const-string v0, "tosversion"

    sput-object v0, Lcom/wrapper/proxyapplication/Util;->versionname:Ljava/lang/String;

    .line 65
    const-string v0, ".flag00O000ll111l.vdex"

    sput-object v0, Lcom/wrapper/proxyapplication/Util;->securename11:Ljava/lang/String;

    .line 68
    const-string v0, "00O000ll111l.vdex"

    sput-object v0, Lcom/wrapper/proxyapplication/Util;->securename14:Ljava/lang/String;

    .line 69
    const-string v0, "00O000ll111l.odex"

    sput-object v0, Lcom/wrapper/proxyapplication/Util;->securename15:Ljava/lang/String;

    .line 71
    const-string v0, "classes.dex"

    sput-object v0, Lcom/wrapper/proxyapplication/Util;->dexname:Ljava/lang/String;

    .line 73
    const/4 v0, 0x1

    sput-boolean v0, Lcom/wrapper/proxyapplication/Util;->ifoverwrite:Z

    .line 76
    const-string v0, "shell-super.2019"

    sput-object v0, Lcom/wrapper/proxyapplication/Util;->libname:Ljava/lang/String;

    .line 77
    return-void
.end method

.method public constructor <init>()V
    .locals 0

    .prologue
    .line 36
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    return-void
.end method

.method public static Comparetxtinzip(Ljava/util/zip/ZipFile;Ljava/lang/String;Ljava/io/File;)I
    .locals 16
    .param p0, "apkzf"    # Ljava/util/zip/ZipFile;
    .param p1, "filepathinzip"    # Ljava/lang/String;
    .param p2, "fileinfiledir"    # Ljava/io/File;

    .prologue
    .line 163
    const/4 v11, -0x1

    .line 165
    .local v11, "result":I
    const/4 v7, 0x0

    .line 167
    .local v7, "cookie_entry":Ljava/util/zip/ZipEntry;
    const/4 v4, 0x0

    .line 169
    .local v4, "checkzbr":Ljava/io/BufferedInputStream;
    const/4 v1, 0x0

    .line 171
    .local v1, "checkfbr":Ljava/io/BufferedInputStream;
    invoke-virtual/range {p0 .. p1}, Ljava/util/zip/ZipFile;->getEntry(Ljava/lang/String;)Ljava/util/zip/ZipEntry;

    move-result-object v7

    .line 174
    if-nez v7, :cond_3

    .line 202
    if-eqz v4, :cond_0

    .line 204
    :try_start_0
    invoke-virtual {v4}, Ljava/io/BufferedInputStream;->close()V
    :try_end_0
    .catch Ljava/io/IOException; {:try_start_0 .. :try_end_0} :catch_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    .line 210
    if-eqz v1, :cond_0

    .line 212
    :try_start_1
    invoke-virtual {v1}, Ljava/io/BufferedInputStream;->close()V
    :try_end_1
    .catch Ljava/io/IOException; {:try_start_1 .. :try_end_1} :catch_3

    .line 176
    :cond_0
    const/4 v14, -0x3

    .line 222
    :goto_0
    return v14

    .line 205
    :catch_0
    move-exception v8

    .line 207
    .local v8, "e":Ljava/io/IOException;
    :try_start_2
    invoke-virtual {v8}, Ljava/io/IOException;->printStackTrace()V
    :try_end_2
    .catchall {:try_start_2 .. :try_end_2} :catchall_0

    .line 210
    if-eqz v1, :cond_1

    .line 212
    :try_start_3
    invoke-virtual {v1}, Ljava/io/BufferedInputStream;->close()V
    :try_end_3
    .catch Ljava/io/IOException; {:try_start_3 .. :try_end_3} :catch_1

    .line 208
    :cond_1
    const/4 v14, -0x2

    goto :goto_0

    .line 213
    :catch_1
    move-exception v8

    .line 215
    invoke-virtual {v8}, Ljava/io/IOException;->printStackTrace()V

    .line 216
    const/4 v14, -0x2

    goto :goto_0

    .line 209
    .end local v8    # "e":Ljava/io/IOException;
    :catchall_0
    move-exception v14

    .line 210
    if-eqz v1, :cond_2

    .line 212
    :try_start_4
    invoke-virtual {v1}, Ljava/io/BufferedInputStream;->close()V
    :try_end_4
    .catch Ljava/io/IOException; {:try_start_4 .. :try_end_4} :catch_2

    .line 219
    :cond_2
    throw v14

    .line 213
    :catch_2
    move-exception v8

    .line 215
    .restart local v8    # "e":Ljava/io/IOException;
    invoke-virtual {v8}, Ljava/io/IOException;->printStackTrace()V

    .line 216
    const/4 v14, -0x2

    goto :goto_0

    .line 213
    .end local v8    # "e":Ljava/io/IOException;
    :catch_3
    move-exception v8

    .line 215
    .restart local v8    # "e":Ljava/io/IOException;
    invoke-virtual {v8}, Ljava/io/IOException;->printStackTrace()V

    .line 216
    const/4 v14, -0x2

    goto :goto_0

    .line 179
    .end local v8    # "e":Ljava/io/IOException;
    :cond_3
    const/16 v14, 0x400

    :try_start_5
    new-array v6, v14, [B

    .line 180
    .local v6, "checkzipbuf":[B
    const/16 v14, 0x400

    new-array v3, v14, [B

    .line 181
    .local v3, "checkfilebuf":[B
    new-instance v5, Ljava/io/BufferedInputStream;

    move-object/from16 v0, p0

    invoke-virtual {v0, v7}, Ljava/util/zip/ZipFile;->getInputStream(Ljava/util/zip/ZipEntry;)Ljava/io/InputStream;

    move-result-object v14

    invoke-direct {v5, v14}, Ljava/io/BufferedInputStream;-><init>(Ljava/io/InputStream;)V
    :try_end_5
    .catch Ljava/lang/Exception; {:try_start_5 .. :try_end_5} :catch_4
    .catchall {:try_start_5 .. :try_end_5} :catchall_2

    .line 182
    .end local v4    # "checkzbr":Ljava/io/BufferedInputStream;
    .local v5, "checkzbr":Ljava/io/BufferedInputStream;
    :try_start_6
    invoke-virtual {v5, v6}, Ljava/io/BufferedInputStream;->read([B)I

    move-result v10

    .line 183
    .local v10, "readziplen":I
    new-instance v14, Ljava/lang/String;

    invoke-direct {v14, v6}, Ljava/lang/String;-><init>([B)V

    const/4 v15, 0x0

    invoke-virtual {v14, v15, v10}, Ljava/lang/String;->substring(II)Ljava/lang/String;

    move-result-object v13

    .line 186
    .local v13, "tmpzipstr":Ljava/lang/String;
    new-instance v2, Ljava/io/BufferedInputStream;

    new-instance v14, Ljava/io/FileInputStream;

    move-object/from16 v0, p2

    invoke-direct {v14, v0}, Ljava/io/FileInputStream;-><init>(Ljava/io/File;)V

    invoke-direct {v2, v14}, Ljava/io/BufferedInputStream;-><init>(Ljava/io/InputStream;)V
    :try_end_6
    .catch Ljava/lang/Exception; {:try_start_6 .. :try_end_6} :catch_11
    .catchall {:try_start_6 .. :try_end_6} :catchall_5

    .line 187
    .end local v1    # "checkfbr":Ljava/io/BufferedInputStream;
    .local v2, "checkfbr":Ljava/io/BufferedInputStream;
    :try_start_7
    invoke-virtual {v2, v3}, Ljava/io/BufferedInputStream;->read([B)I

    move-result v9

    .line 188
    .local v9, "readfilelen":I
    new-instance v14, Ljava/lang/String;

    invoke-direct {v14, v3}, Ljava/lang/String;-><init>([B)V

    const/4 v15, 0x0

    invoke-virtual {v14, v15, v9}, Ljava/lang/String;->substring(II)Ljava/lang/String;

    move-result-object v12

    .line 191
    .local v12, "tmpfilestr":Ljava/lang/String;
    invoke-virtual {v12, v13}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    :try_end_7
    .catch Ljava/lang/Exception; {:try_start_7 .. :try_end_7} :catch_12
    .catchall {:try_start_7 .. :try_end_7} :catchall_6

    move-result v14

    if-eqz v14, :cond_5

    .line 192
    const/4 v11, 0x1

    .line 202
    :goto_1
    if-eqz v5, :cond_4

    .line 204
    :try_start_8
    invoke-virtual {v5}, Ljava/io/BufferedInputStream;->close()V
    :try_end_8
    .catch Ljava/io/IOException; {:try_start_8 .. :try_end_8} :catch_d
    .catchall {:try_start_8 .. :try_end_8} :catchall_4

    .line 210
    if-eqz v2, :cond_4

    .line 212
    :try_start_9
    invoke-virtual {v2}, Ljava/io/BufferedInputStream;->close()V
    :try_end_9
    .catch Ljava/io/IOException; {:try_start_9 .. :try_end_9} :catch_10

    :cond_4
    move-object v1, v2

    .end local v2    # "checkfbr":Ljava/io/BufferedInputStream;
    .restart local v1    # "checkfbr":Ljava/io/BufferedInputStream;
    move-object v4, v5

    .end local v5    # "checkzbr":Ljava/io/BufferedInputStream;
    .restart local v4    # "checkzbr":Ljava/io/BufferedInputStream;
    move v14, v11

    .line 222
    goto :goto_0

    .line 194
    .end local v1    # "checkfbr":Ljava/io/BufferedInputStream;
    .end local v4    # "checkzbr":Ljava/io/BufferedInputStream;
    .restart local v2    # "checkfbr":Ljava/io/BufferedInputStream;
    .restart local v5    # "checkzbr":Ljava/io/BufferedInputStream;
    :cond_5
    const/4 v11, 0x0

    goto :goto_1

    .line 197
    .end local v2    # "checkfbr":Ljava/io/BufferedInputStream;
    .end local v3    # "checkfilebuf":[B
    .end local v5    # "checkzbr":Ljava/io/BufferedInputStream;
    .end local v6    # "checkzipbuf":[B
    .end local v9    # "readfilelen":I
    .end local v10    # "readziplen":I
    .end local v12    # "tmpfilestr":Ljava/lang/String;
    .end local v13    # "tmpzipstr":Ljava/lang/String;
    .restart local v1    # "checkfbr":Ljava/io/BufferedInputStream;
    .restart local v4    # "checkzbr":Ljava/io/BufferedInputStream;
    :catch_4
    move-exception v8

    .line 199
    .local v8, "e":Ljava/lang/Exception;
    :goto_2
    :try_start_a
    invoke-virtual {v8}, Ljava/lang/Exception;->printStackTrace()V
    :try_end_a
    .catchall {:try_start_a .. :try_end_a} :catchall_2

    .line 202
    if-eqz v4, :cond_6

    .line 204
    :try_start_b
    invoke-virtual {v4}, Ljava/io/BufferedInputStream;->close()V
    :try_end_b
    .catch Ljava/io/IOException; {:try_start_b .. :try_end_b} :catch_5
    .catchall {:try_start_b .. :try_end_b} :catchall_1

    .line 210
    if-eqz v1, :cond_6

    .line 212
    :try_start_c
    invoke-virtual {v1}, Ljava/io/BufferedInputStream;->close()V
    :try_end_c
    .catch Ljava/io/IOException; {:try_start_c .. :try_end_c} :catch_8

    .line 200
    :cond_6
    const/4 v14, -0x2

    goto/16 :goto_0

    .line 205
    :catch_5
    move-exception v8

    .line 207
    .local v8, "e":Ljava/io/IOException;
    :try_start_d
    invoke-virtual {v8}, Ljava/io/IOException;->printStackTrace()V
    :try_end_d
    .catchall {:try_start_d .. :try_end_d} :catchall_1

    .line 210
    if-eqz v1, :cond_7

    .line 212
    :try_start_e
    invoke-virtual {v1}, Ljava/io/BufferedInputStream;->close()V
    :try_end_e
    .catch Ljava/io/IOException; {:try_start_e .. :try_end_e} :catch_6

    .line 208
    :cond_7
    const/4 v14, -0x2

    goto/16 :goto_0

    .line 213
    :catch_6
    move-exception v8

    .line 215
    invoke-virtual {v8}, Ljava/io/IOException;->printStackTrace()V

    .line 216
    const/4 v14, -0x2

    goto/16 :goto_0

    .line 209
    .end local v8    # "e":Ljava/io/IOException;
    :catchall_1
    move-exception v14

    .line 210
    if-eqz v1, :cond_8

    .line 212
    :try_start_f
    invoke-virtual {v1}, Ljava/io/BufferedInputStream;->close()V
    :try_end_f
    .catch Ljava/io/IOException; {:try_start_f .. :try_end_f} :catch_7

    .line 219
    :cond_8
    throw v14

    .line 213
    :catch_7
    move-exception v8

    .line 215
    .restart local v8    # "e":Ljava/io/IOException;
    invoke-virtual {v8}, Ljava/io/IOException;->printStackTrace()V

    .line 216
    const/4 v14, -0x2

    goto/16 :goto_0

    .line 213
    .local v8, "e":Ljava/lang/Exception;
    :catch_8
    move-exception v8

    .line 215
    .local v8, "e":Ljava/io/IOException;
    invoke-virtual {v8}, Ljava/io/IOException;->printStackTrace()V

    .line 216
    const/4 v14, -0x2

    goto/16 :goto_0

    .line 201
    .end local v8    # "e":Ljava/io/IOException;
    :catchall_2
    move-exception v14

    .line 202
    :goto_3
    if-eqz v4, :cond_9

    .line 204
    :try_start_10
    invoke-virtual {v4}, Ljava/io/BufferedInputStream;->close()V
    :try_end_10
    .catch Ljava/io/IOException; {:try_start_10 .. :try_end_10} :catch_9
    .catchall {:try_start_10 .. :try_end_10} :catchall_3

    .line 210
    if-eqz v1, :cond_9

    .line 212
    :try_start_11
    invoke-virtual {v1}, Ljava/io/BufferedInputStream;->close()V
    :try_end_11
    .catch Ljava/io/IOException; {:try_start_11 .. :try_end_11} :catch_c

    .line 221
    :cond_9
    throw v14

    .line 205
    :catch_9
    move-exception v8

    .line 207
    .restart local v8    # "e":Ljava/io/IOException;
    :try_start_12
    invoke-virtual {v8}, Ljava/io/IOException;->printStackTrace()V
    :try_end_12
    .catchall {:try_start_12 .. :try_end_12} :catchall_3

    .line 210
    if-eqz v1, :cond_a

    .line 212
    :try_start_13
    invoke-virtual {v1}, Ljava/io/BufferedInputStream;->close()V
    :try_end_13
    .catch Ljava/io/IOException; {:try_start_13 .. :try_end_13} :catch_a

    .line 208
    :cond_a
    const/4 v14, -0x2

    goto/16 :goto_0

    .line 213
    :catch_a
    move-exception v8

    .line 215
    invoke-virtual {v8}, Ljava/io/IOException;->printStackTrace()V

    .line 216
    const/4 v14, -0x2

    goto/16 :goto_0

    .line 209
    .end local v8    # "e":Ljava/io/IOException;
    :catchall_3
    move-exception v14

    .line 210
    if-eqz v1, :cond_b

    .line 212
    :try_start_14
    invoke-virtual {v1}, Ljava/io/BufferedInputStream;->close()V
    :try_end_14
    .catch Ljava/io/IOException; {:try_start_14 .. :try_end_14} :catch_b

    .line 219
    :cond_b
    throw v14

    .line 213
    :catch_b
    move-exception v8

    .line 215
    .restart local v8    # "e":Ljava/io/IOException;
    invoke-virtual {v8}, Ljava/io/IOException;->printStackTrace()V

    .line 216
    const/4 v14, -0x2

    goto/16 :goto_0

    .line 213
    .end local v8    # "e":Ljava/io/IOException;
    :catch_c
    move-exception v8

    .line 215
    .restart local v8    # "e":Ljava/io/IOException;
    invoke-virtual {v8}, Ljava/io/IOException;->printStackTrace()V

    .line 216
    const/4 v14, -0x2

    goto/16 :goto_0

    .line 205
    .end local v1    # "checkfbr":Ljava/io/BufferedInputStream;
    .end local v4    # "checkzbr":Ljava/io/BufferedInputStream;
    .end local v8    # "e":Ljava/io/IOException;
    .restart local v2    # "checkfbr":Ljava/io/BufferedInputStream;
    .restart local v3    # "checkfilebuf":[B
    .restart local v5    # "checkzbr":Ljava/io/BufferedInputStream;
    .restart local v6    # "checkzipbuf":[B
    .restart local v9    # "readfilelen":I
    .restart local v10    # "readziplen":I
    .restart local v12    # "tmpfilestr":Ljava/lang/String;
    .restart local v13    # "tmpzipstr":Ljava/lang/String;
    :catch_d
    move-exception v8

    .line 207
    .restart local v8    # "e":Ljava/io/IOException;
    :try_start_15
    invoke-virtual {v8}, Ljava/io/IOException;->printStackTrace()V
    :try_end_15
    .catchall {:try_start_15 .. :try_end_15} :catchall_4

    .line 210
    if-eqz v2, :cond_c

    .line 212
    :try_start_16
    invoke-virtual {v2}, Ljava/io/BufferedInputStream;->close()V
    :try_end_16
    .catch Ljava/io/IOException; {:try_start_16 .. :try_end_16} :catch_e

    .line 208
    :cond_c
    const/4 v14, -0x2

    move-object v1, v2

    .end local v2    # "checkfbr":Ljava/io/BufferedInputStream;
    .restart local v1    # "checkfbr":Ljava/io/BufferedInputStream;
    move-object v4, v5

    .end local v5    # "checkzbr":Ljava/io/BufferedInputStream;
    .restart local v4    # "checkzbr":Ljava/io/BufferedInputStream;
    goto/16 :goto_0

    .line 213
    .end local v1    # "checkfbr":Ljava/io/BufferedInputStream;
    .end local v4    # "checkzbr":Ljava/io/BufferedInputStream;
    .restart local v2    # "checkfbr":Ljava/io/BufferedInputStream;
    .restart local v5    # "checkzbr":Ljava/io/BufferedInputStream;
    :catch_e
    move-exception v8

    .line 215
    invoke-virtual {v8}, Ljava/io/IOException;->printStackTrace()V

    .line 216
    const/4 v14, -0x2

    move-object v1, v2

    .end local v2    # "checkfbr":Ljava/io/BufferedInputStream;
    .restart local v1    # "checkfbr":Ljava/io/BufferedInputStream;
    move-object v4, v5

    .end local v5    # "checkzbr":Ljava/io/BufferedInputStream;
    .restart local v4    # "checkzbr":Ljava/io/BufferedInputStream;
    goto/16 :goto_0

    .line 209
    .end local v1    # "checkfbr":Ljava/io/BufferedInputStream;
    .end local v4    # "checkzbr":Ljava/io/BufferedInputStream;
    .end local v8    # "e":Ljava/io/IOException;
    .restart local v2    # "checkfbr":Ljava/io/BufferedInputStream;
    .restart local v5    # "checkzbr":Ljava/io/BufferedInputStream;
    :catchall_4
    move-exception v14

    .line 210
    if-eqz v2, :cond_d

    .line 212
    :try_start_17
    invoke-virtual {v2}, Ljava/io/BufferedInputStream;->close()V
    :try_end_17
    .catch Ljava/io/IOException; {:try_start_17 .. :try_end_17} :catch_f

    .line 219
    :cond_d
    throw v14

    .line 213
    :catch_f
    move-exception v8

    .line 215
    .restart local v8    # "e":Ljava/io/IOException;
    invoke-virtual {v8}, Ljava/io/IOException;->printStackTrace()V

    .line 216
    const/4 v14, -0x2

    move-object v1, v2

    .end local v2    # "checkfbr":Ljava/io/BufferedInputStream;
    .restart local v1    # "checkfbr":Ljava/io/BufferedInputStream;
    move-object v4, v5

    .end local v5    # "checkzbr":Ljava/io/BufferedInputStream;
    .restart local v4    # "checkzbr":Ljava/io/BufferedInputStream;
    goto/16 :goto_0

    .line 213
    .end local v1    # "checkfbr":Ljava/io/BufferedInputStream;
    .end local v4    # "checkzbr":Ljava/io/BufferedInputStream;
    .end local v8    # "e":Ljava/io/IOException;
    .restart local v2    # "checkfbr":Ljava/io/BufferedInputStream;
    .restart local v5    # "checkzbr":Ljava/io/BufferedInputStream;
    :catch_10
    move-exception v8

    .line 215
    .restart local v8    # "e":Ljava/io/IOException;
    invoke-virtual {v8}, Ljava/io/IOException;->printStackTrace()V

    .line 216
    const/4 v14, -0x2

    move-object v1, v2

    .end local v2    # "checkfbr":Ljava/io/BufferedInputStream;
    .restart local v1    # "checkfbr":Ljava/io/BufferedInputStream;
    move-object v4, v5

    .end local v5    # "checkzbr":Ljava/io/BufferedInputStream;
    .restart local v4    # "checkzbr":Ljava/io/BufferedInputStream;
    goto/16 :goto_0

    .line 201
    .end local v4    # "checkzbr":Ljava/io/BufferedInputStream;
    .end local v8    # "e":Ljava/io/IOException;
    .end local v9    # "readfilelen":I
    .end local v10    # "readziplen":I
    .end local v12    # "tmpfilestr":Ljava/lang/String;
    .end local v13    # "tmpzipstr":Ljava/lang/String;
    .restart local v5    # "checkzbr":Ljava/io/BufferedInputStream;
    :catchall_5
    move-exception v14

    move-object v4, v5

    .end local v5    # "checkzbr":Ljava/io/BufferedInputStream;
    .restart local v4    # "checkzbr":Ljava/io/BufferedInputStream;
    goto :goto_3

    .end local v1    # "checkfbr":Ljava/io/BufferedInputStream;
    .end local v4    # "checkzbr":Ljava/io/BufferedInputStream;
    .restart local v2    # "checkfbr":Ljava/io/BufferedInputStream;
    .restart local v5    # "checkzbr":Ljava/io/BufferedInputStream;
    .restart local v10    # "readziplen":I
    .restart local v13    # "tmpzipstr":Ljava/lang/String;
    :catchall_6
    move-exception v14

    move-object v1, v2

    .end local v2    # "checkfbr":Ljava/io/BufferedInputStream;
    .restart local v1    # "checkfbr":Ljava/io/BufferedInputStream;
    move-object v4, v5

    .end local v5    # "checkzbr":Ljava/io/BufferedInputStream;
    .restart local v4    # "checkzbr":Ljava/io/BufferedInputStream;
    goto :goto_3

    .line 197
    .end local v4    # "checkzbr":Ljava/io/BufferedInputStream;
    .end local v10    # "readziplen":I
    .end local v13    # "tmpzipstr":Ljava/lang/String;
    .restart local v5    # "checkzbr":Ljava/io/BufferedInputStream;
    :catch_11
    move-exception v8

    move-object v4, v5

    .end local v5    # "checkzbr":Ljava/io/BufferedInputStream;
    .restart local v4    # "checkzbr":Ljava/io/BufferedInputStream;
    goto/16 :goto_2

    .end local v1    # "checkfbr":Ljava/io/BufferedInputStream;
    .end local v4    # "checkzbr":Ljava/io/BufferedInputStream;
    .restart local v2    # "checkfbr":Ljava/io/BufferedInputStream;
    .restart local v5    # "checkzbr":Ljava/io/BufferedInputStream;
    .restart local v10    # "readziplen":I
    .restart local v13    # "tmpzipstr":Ljava/lang/String;
    :catch_12
    move-exception v8

    move-object v1, v2

    .end local v2    # "checkfbr":Ljava/io/BufferedInputStream;
    .restart local v1    # "checkfbr":Ljava/io/BufferedInputStream;
    move-object v4, v5

    .end local v5    # "checkzbr":Ljava/io/BufferedInputStream;
    .restart local v4    # "checkzbr":Ljava/io/BufferedInputStream;
    goto/16 :goto_2
.end method

.method public static CreatenewFileName(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;
    .locals 3
    .param p0, "Oldfilename"    # Ljava/lang/String;
    .param p1, "SplitString"    # Ljava/lang/String;
    .param p2, "InsertString"    # Ljava/lang/String;

    .prologue
    .line 599
    invoke-virtual {p0, p1}, Ljava/lang/String;->lastIndexOf(Ljava/lang/String;)I

    move-result v0

    .line 600
    .local v0, "index":I
    if-ltz v0, :cond_0

    .line 601
    new-instance v1, Ljava/lang/StringBuilder;

    const/4 v2, 0x0

    invoke-virtual {p0, v2, v0}, Ljava/lang/String;->substring(II)Ljava/lang/String;

    move-result-object v2

    invoke-static {v2}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v2

    invoke-direct {v1, v2}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    invoke-virtual {v1, p2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v1

    invoke-virtual {p0}, Ljava/lang/String;->length()I

    move-result v2

    invoke-virtual {p0, v0, v2}, Ljava/lang/String;->substring(II)Ljava/lang/String;

    move-result-object v2

    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v1

    invoke-virtual {v1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v1

    .line 603
    :goto_0
    return-object v1

    :cond_0
    const/4 v1, 0x0

    goto :goto_0
.end method

.method public static DeleteFile(Ljava/lang/String;)I
    .locals 2
    .param p0, "filepath"    # Ljava/lang/String;

    .prologue
    .line 85
    new-instance v0, Ljava/io/File;

    invoke-direct {v0, p0}, Ljava/io/File;-><init>(Ljava/lang/String;)V

    .line 86
    .local v0, "tmpfile":Ljava/io/File;
    invoke-virtual {v0}, Ljava/io/File;->exists()Z

    move-result v1

    if-eqz v1, :cond_1

    .line 87
    invoke-virtual {v0}, Ljava/io/File;->delete()Z

    move-result v1

    if-nez v1, :cond_0

    .line 88
    const/4 v1, -0x2

    .line 92
    :goto_0
    return v1

    .line 90
    :cond_0
    const/4 v1, 0x1

    goto :goto_0

    .line 92
    :cond_1
    const/4 v1, -0x1

    goto :goto_0
.end method

.method public static PrepareSecurefiles(Landroid/content/Context;Ljava/util/zip/ZipFile;)I
    .locals 32
    .param p0, "ctx"    # Landroid/content/Context;
    .param p1, "apkzf"    # Ljava/util/zip/ZipFile;

    .prologue
    .line 247
    const/4 v6, 0x0

    .line 249
    .local v6, "Cookiefile":Ljava/io/File;
    const/16 v19, 0x0

    .line 250
    .local v19, "file_channel":Ljava/nio/channels/FileChannel;
    const/16 v23, 0x0

    .line 252
    .local v23, "file_lock":Ljava/nio/channels/FileLock;
    const/16 v25, 0x0

    .line 254
    .local v25, "raf":Ljava/io/RandomAccessFile;
    new-instance v27, Ljava/lang/StringBuilder;

    invoke-virtual/range {p0 .. p0}, Landroid/content/Context;->getFilesDir()Ljava/io/File;

    move-result-object v28

    invoke-virtual/range {v28 .. v28}, Ljava/io/File;->getAbsolutePath()Ljava/lang/String;

    move-result-object v28

    invoke-static/range {v28 .. v28}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v28

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v28, "/prodexdir"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v4

    .line 257
    .local v4, "Appfiledir":Ljava/lang/String;
    new-instance v5, Ljava/io/File;

    invoke-direct {v5, v4}, Ljava/io/File;-><init>(Ljava/lang/String;)V

    .line 258
    .local v5, "Appprofiledir":Ljava/io/File;
    invoke-virtual {v5}, Ljava/io/File;->isDirectory()Z

    move-result v27

    if-nez v27, :cond_0

    .line 259
    invoke-virtual {v5}, Ljava/io/File;->mkdir()Z

    .line 262
    :cond_0
    new-instance v27, Ljava/lang/StringBuilder;

    invoke-static {v4}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v28

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    sget-object v28, Lcom/wrapper/proxyapplication/Util;->versionname:Ljava/lang/String;

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v9

    .line 263
    .local v9, "Cookiefilepath":Ljava/lang/String;
    new-instance v27, Ljava/lang/StringBuilder;

    invoke-static {v4}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v28

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v28, "/backUp"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v11

    .line 264
    .local v11, "backupfilepath":Ljava/lang/String;
    new-instance v27, Ljava/lang/StringBuilder;

    invoke-static {v4}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v28

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v28, "/firstLoad"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v24

    .line 265
    .local v24, "firstloadfilepath":Ljava/lang/String;
    new-instance v27, Ljava/lang/StringBuilder;

    const-string v28, "assets/"

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    sget-object v28, Lcom/wrapper/proxyapplication/Util;->versionname:Ljava/lang/String;

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v8

    .line 266
    .local v8, "Cookiefileinzip":Ljava/lang/String;
    new-instance v27, Ljava/lang/StringBuilder;

    const-string v28, "libtosprotection."

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    sget-object v28, Lcom/wrapper/proxyapplication/Util;->CPUABI:Ljava/lang/String;

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    const-string v28, ".so"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v10

    .line 270
    .local v10, "Libnameinapk":Ljava/lang/String;
    :try_start_0
    new-instance v26, Ljava/io/RandomAccessFile;

    const-string v27, "rw"

    move-object/from16 v0, v26

    move-object/from16 v1, v27

    invoke-direct {v0, v9, v1}, Ljava/io/RandomAccessFile;-><init>(Ljava/lang/String;Ljava/lang/String;)V
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_d
    .catchall {:try_start_0 .. :try_end_0} :catchall_8

    .line 272
    .end local v25    # "raf":Ljava/io/RandomAccessFile;
    .local v26, "raf":Ljava/io/RandomAccessFile;
    :try_start_1
    invoke-virtual/range {v26 .. v26}, Ljava/io/RandomAccessFile;->getChannel()Ljava/nio/channels/FileChannel;

    move-result-object v19

    .line 274
    invoke-virtual/range {v19 .. v19}, Ljava/nio/channels/FileChannel;->lock()Ljava/nio/channels/FileLock;

    move-result-object v23

    .line 281
    new-instance v7, Ljava/io/File;

    invoke-direct {v7, v9}, Ljava/io/File;-><init>(Ljava/lang/String;)V
    :try_end_1
    .catch Ljava/lang/Exception; {:try_start_1 .. :try_end_1} :catch_35
    .catchall {:try_start_1 .. :try_end_1} :catchall_11

    .line 283
    .end local v6    # "Cookiefile":Ljava/io/File;
    .local v7, "Cookiefile":Ljava/io/File;
    :try_start_2
    invoke-virtual {v7}, Ljava/io/File;->length()J

    move-result-wide v28

    const-wide/16 v30, 0x0

    cmp-long v27, v28, v30

    if-eqz v27, :cond_10

    .line 287
    move-object/from16 v0, p1

    invoke-static {v0, v8, v7}, Lcom/wrapper/proxyapplication/Util;->Comparetxtinzip(Ljava/util/zip/ZipFile;Ljava/lang/String;Ljava/io/File;)I

    move-result v12

    .line 289
    .local v12, "compareResult":I
    const/16 v27, 0x1

    move/from16 v0, v27

    if-ne v12, v0, :cond_e

    .line 290
    new-instance v27, Ljava/lang/StringBuilder;

    const-string v28, "assets/"

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    sget-object v28, Lcom/wrapper/proxyapplication/Util;->securename5:Ljava/lang/String;

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    new-instance v28, Ljava/io/File;

    new-instance v29, Ljava/lang/StringBuilder;

    invoke-static {v4}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v30

    invoke-direct/range {v29 .. v30}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v30, "/"

    invoke-virtual/range {v29 .. v30}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v29

    sget-object v30, Lcom/wrapper/proxyapplication/Util;->securename5:Ljava/lang/String;

    invoke-virtual/range {v29 .. v30}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v29

    invoke-virtual/range {v29 .. v29}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v29

    invoke-direct/range {v28 .. v29}, Ljava/io/File;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, p1

    move-object/from16 v1, v27

    move-object/from16 v2, v28

    invoke-static {v0, v1, v2}, Lcom/wrapper/proxyapplication/Util;->checkCopiedFileCrc(Ljava/util/zip/ZipFile;Ljava/lang/String;Ljava/io/File;)Z

    move-result v27

    if-eqz v27, :cond_e

    .line 291
    new-instance v27, Ljava/lang/StringBuilder;

    const-string v28, "assets/"

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    sget-object v28, Lcom/wrapper/proxyapplication/Util;->securename6:Ljava/lang/String;

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    .line 292
    new-instance v28, Ljava/io/File;

    new-instance v29, Ljava/lang/StringBuilder;

    invoke-static {v4}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v30

    invoke-direct/range {v29 .. v30}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v30, "/"

    invoke-virtual/range {v29 .. v30}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v29

    sget-object v30, Lcom/wrapper/proxyapplication/Util;->securename6:Ljava/lang/String;

    invoke-virtual/range {v29 .. v30}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v29

    invoke-virtual/range {v29 .. v29}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v29

    invoke-direct/range {v28 .. v29}, Ljava/io/File;-><init>(Ljava/lang/String;)V

    .line 291
    move-object/from16 v0, p1

    move-object/from16 v1, v27

    move-object/from16 v2, v28

    invoke-static {v0, v1, v2}, Lcom/wrapper/proxyapplication/Util;->checkCopiedFileCrc(Ljava/util/zip/ZipFile;Ljava/lang/String;Ljava/io/File;)Z
    :try_end_2
    .catch Ljava/lang/Exception; {:try_start_2 .. :try_end_2} :catch_36
    .catchall {:try_start_2 .. :try_end_2} :catchall_12

    move-result v27

    .line 292
    if-eqz v27, :cond_e

    .line 441
    new-instance v27, Ljava/lang/StringBuilder;

    const-string v28, "assets/"

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, v27

    invoke-virtual {v0, v10}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    move-object/from16 v0, p1

    move-object/from16 v1, v27

    invoke-virtual {v0, v1}, Ljava/util/zip/ZipFile;->getEntry(Ljava/lang/String;)Ljava/util/zip/ZipEntry;

    move-result-object v18

    .line 442
    .local v18, "fileUnzip":Ljava/util/zip/ZipEntry;
    if-eqz v18, :cond_1

    .line 443
    new-instance v27, Ljava/lang/StringBuilder;

    invoke-static {v4}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v28

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    sget-object v28, Lcom/wrapper/proxyapplication/Util;->libname:Ljava/lang/String;

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    invoke-virtual/range {v18 .. v18}, Ljava/util/zip/ZipEntry;->getSize()J

    move-result-wide v28

    invoke-static/range {v27 .. v29}, Lcom/wrapper/proxyapplication/Util;->isFileValid(Ljava/lang/String;J)Z

    move-result v27

    if-nez v27, :cond_1

    .line 444
    new-instance v27, Ljava/lang/StringBuilder;

    const-string v28, "assets/"

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, v27

    invoke-virtual {v0, v10}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    new-instance v28, Ljava/io/File;

    new-instance v29, Ljava/lang/StringBuilder;

    invoke-static {v4}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v30

    invoke-direct/range {v29 .. v30}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v30, "/"

    invoke-virtual/range {v29 .. v30}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v29

    sget-object v30, Lcom/wrapper/proxyapplication/Util;->libname:Ljava/lang/String;

    invoke-virtual/range {v29 .. v30}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v29

    invoke-virtual/range {v29 .. v29}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v29

    invoke-direct/range {v28 .. v29}, Ljava/io/File;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, p1

    move-object/from16 v1, v27

    move-object/from16 v2, v28

    invoke-static {v0, v1, v2}, Lcom/wrapper/proxyapplication/Util;->UnzipFile(Ljava/util/zip/ZipFile;Ljava/lang/String;Ljava/io/File;)Z

    .line 447
    :cond_1
    new-instance v27, Ljava/lang/StringBuilder;

    const-string v28, "assets/"

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, v27

    invoke-virtual {v0, v10}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    move-object/from16 v0, p1

    move-object/from16 v1, v27

    invoke-virtual {v0, v1}, Ljava/util/zip/ZipFile;->getEntry(Ljava/lang/String;)Ljava/util/zip/ZipEntry;

    move-result-object v18

    .line 448
    if-eqz v18, :cond_2

    .line 449
    new-instance v27, Ljava/lang/StringBuilder;

    invoke-static {v4}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v28

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    sget-object v28, Lcom/wrapper/proxyapplication/Util;->securename6:Ljava/lang/String;

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    invoke-virtual/range {v18 .. v18}, Ljava/util/zip/ZipEntry;->getSize()J

    move-result-wide v28

    invoke-static/range {v27 .. v29}, Lcom/wrapper/proxyapplication/Util;->isFileValid(Ljava/lang/String;J)Z

    move-result v27

    if-nez v27, :cond_2

    .line 450
    new-instance v27, Ljava/lang/StringBuilder;

    const-string v28, "assets/"

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    sget-object v28, Lcom/wrapper/proxyapplication/Util;->securename6:Ljava/lang/String;

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    new-instance v28, Ljava/io/File;

    new-instance v29, Ljava/lang/StringBuilder;

    invoke-static {v4}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v30

    invoke-direct/range {v29 .. v30}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v30, "/"

    invoke-virtual/range {v29 .. v30}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v29

    sget-object v30, Lcom/wrapper/proxyapplication/Util;->securename6:Ljava/lang/String;

    invoke-virtual/range {v29 .. v30}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v29

    invoke-virtual/range {v29 .. v29}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v29

    invoke-direct/range {v28 .. v29}, Ljava/io/File;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, p1

    move-object/from16 v1, v27

    move-object/from16 v2, v28

    invoke-static {v0, v1, v2}, Lcom/wrapper/proxyapplication/Util;->UnzipFile(Ljava/util/zip/ZipFile;Ljava/lang/String;Ljava/io/File;)Z

    .line 453
    :cond_2
    new-instance v27, Ljava/lang/StringBuilder;

    const-string v28, "assets/"

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, v27

    invoke-virtual {v0, v10}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    move-object/from16 v0, p1

    move-object/from16 v1, v27

    invoke-virtual {v0, v1}, Ljava/util/zip/ZipFile;->getEntry(Ljava/lang/String;)Ljava/util/zip/ZipEntry;

    move-result-object v18

    .line 454
    if-eqz v18, :cond_3

    .line 455
    new-instance v27, Ljava/lang/StringBuilder;

    invoke-static {v4}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v28

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    sget-object v28, Lcom/wrapper/proxyapplication/Util;->securename7:Ljava/lang/String;

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    invoke-virtual/range {v18 .. v18}, Ljava/util/zip/ZipEntry;->getSize()J

    move-result-wide v28

    invoke-static/range {v27 .. v29}, Lcom/wrapper/proxyapplication/Util;->isFileValid(Ljava/lang/String;J)Z

    move-result v27

    if-nez v27, :cond_3

    .line 456
    new-instance v27, Ljava/lang/StringBuilder;

    const-string v28, "assets/"

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    sget-object v28, Lcom/wrapper/proxyapplication/Util;->securename7:Ljava/lang/String;

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    new-instance v28, Ljava/io/File;

    new-instance v29, Ljava/lang/StringBuilder;

    invoke-static {v4}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v30

    invoke-direct/range {v29 .. v30}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v30, "/"

    invoke-virtual/range {v29 .. v30}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v29

    sget-object v30, Lcom/wrapper/proxyapplication/Util;->securename7:Ljava/lang/String;

    invoke-virtual/range {v29 .. v30}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v29

    invoke-virtual/range {v29 .. v29}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v29

    invoke-direct/range {v28 .. v29}, Ljava/io/File;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, p1

    move-object/from16 v1, v27

    move-object/from16 v2, v28

    invoke-static {v0, v1, v2}, Lcom/wrapper/proxyapplication/Util;->UnzipFile(Ljava/util/zip/ZipFile;Ljava/lang/String;Ljava/io/File;)Z

    .line 459
    :cond_3
    move-object/from16 v0, p1

    invoke-virtual {v0, v8}, Ljava/util/zip/ZipFile;->getEntry(Ljava/lang/String;)Ljava/util/zip/ZipEntry;

    move-result-object v18

    .line 460
    if-eqz v18, :cond_4

    .line 461
    invoke-virtual/range {v18 .. v18}, Ljava/util/zip/ZipEntry;->getSize()J

    move-result-wide v28

    move-wide/from16 v0, v28

    invoke-static {v9, v0, v1}, Lcom/wrapper/proxyapplication/Util;->isFileValid(Ljava/lang/String;J)Z

    move-result v27

    if-nez v27, :cond_4

    .line 462
    new-instance v27, Ljava/io/File;

    move-object/from16 v0, v27

    invoke-direct {v0, v9}, Ljava/io/File;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, p1

    move-object/from16 v1, v27

    invoke-static {v0, v8, v1}, Lcom/wrapper/proxyapplication/Util;->UnzipFile(Ljava/util/zip/ZipFile;Ljava/lang/String;Ljava/io/File;)Z

    .line 465
    :cond_4
    if-eqz v23, :cond_5

    .line 467
    :try_start_3
    invoke-virtual/range {v23 .. v23}, Ljava/nio/channels/FileLock;->release()V
    :try_end_3
    .catch Ljava/io/IOException; {:try_start_3 .. :try_end_3} :catch_0
    .catchall {:try_start_3 .. :try_end_3} :catchall_1

    .line 473
    if-eqz v19, :cond_5

    .line 475
    :try_start_4
    invoke-virtual/range {v19 .. v19}, Ljava/nio/channels/FileChannel;->close()V
    :try_end_4
    .catch Ljava/io/IOException; {:try_start_4 .. :try_end_4} :catch_9
    .catchall {:try_start_4 .. :try_end_4} :catchall_3

    .line 481
    if-eqz v26, :cond_5

    .line 483
    :try_start_5
    invoke-virtual/range {v26 .. v26}, Ljava/io/RandomAccessFile;->close()V
    :try_end_5
    .catch Ljava/io/IOException; {:try_start_5 .. :try_end_5} :catch_c

    .line 294
    :cond_5
    const/16 v27, 0x2

    move-object/from16 v25, v26

    .end local v26    # "raf":Ljava/io/RandomAccessFile;
    .restart local v25    # "raf":Ljava/io/RandomAccessFile;
    move-object v6, v7

    .line 495
    .end local v7    # "Cookiefile":Ljava/io/File;
    .end local v12    # "compareResult":I
    .restart local v6    # "Cookiefile":Ljava/io/File;
    :goto_0
    return v27

    .line 468
    .end local v6    # "Cookiefile":Ljava/io/File;
    .end local v25    # "raf":Ljava/io/RandomAccessFile;
    .restart local v7    # "Cookiefile":Ljava/io/File;
    .restart local v12    # "compareResult":I
    .restart local v26    # "raf":Ljava/io/RandomAccessFile;
    :catch_0
    move-exception v17

    .line 470
    .local v17, "e":Ljava/io/IOException;
    :try_start_6
    invoke-virtual/range {v17 .. v17}, Ljava/io/IOException;->printStackTrace()V
    :try_end_6
    .catchall {:try_start_6 .. :try_end_6} :catchall_1

    .line 473
    if-eqz v19, :cond_6

    .line 475
    :try_start_7
    invoke-virtual/range {v19 .. v19}, Ljava/nio/channels/FileChannel;->close()V
    :try_end_7
    .catch Ljava/io/IOException; {:try_start_7 .. :try_end_7} :catch_1
    .catchall {:try_start_7 .. :try_end_7} :catchall_0

    .line 481
    if-eqz v26, :cond_6

    .line 483
    :try_start_8
    invoke-virtual/range {v26 .. v26}, Ljava/io/RandomAccessFile;->close()V
    :try_end_8
    .catch Ljava/io/IOException; {:try_start_8 .. :try_end_8} :catch_4

    .line 471
    :cond_6
    const/16 v27, -0x1

    move-object/from16 v25, v26

    .end local v26    # "raf":Ljava/io/RandomAccessFile;
    .restart local v25    # "raf":Ljava/io/RandomAccessFile;
    move-object v6, v7

    .end local v7    # "Cookiefile":Ljava/io/File;
    .restart local v6    # "Cookiefile":Ljava/io/File;
    goto :goto_0

    .line 476
    .end local v6    # "Cookiefile":Ljava/io/File;
    .end local v25    # "raf":Ljava/io/RandomAccessFile;
    .restart local v7    # "Cookiefile":Ljava/io/File;
    .restart local v26    # "raf":Ljava/io/RandomAccessFile;
    :catch_1
    move-exception v17

    .line 478
    :try_start_9
    invoke-virtual/range {v17 .. v17}, Ljava/io/IOException;->printStackTrace()V
    :try_end_9
    .catchall {:try_start_9 .. :try_end_9} :catchall_0

    .line 481
    if-eqz v26, :cond_7

    .line 483
    :try_start_a
    invoke-virtual/range {v26 .. v26}, Ljava/io/RandomAccessFile;->close()V
    :try_end_a
    .catch Ljava/io/IOException; {:try_start_a .. :try_end_a} :catch_2

    .line 479
    :cond_7
    const/16 v27, -0x1

    move-object/from16 v25, v26

    .end local v26    # "raf":Ljava/io/RandomAccessFile;
    .restart local v25    # "raf":Ljava/io/RandomAccessFile;
    move-object v6, v7

    .end local v7    # "Cookiefile":Ljava/io/File;
    .restart local v6    # "Cookiefile":Ljava/io/File;
    goto :goto_0

    .line 484
    .end local v6    # "Cookiefile":Ljava/io/File;
    .end local v25    # "raf":Ljava/io/RandomAccessFile;
    .restart local v7    # "Cookiefile":Ljava/io/File;
    .restart local v26    # "raf":Ljava/io/RandomAccessFile;
    :catch_2
    move-exception v17

    .line 486
    invoke-virtual/range {v17 .. v17}, Ljava/io/IOException;->printStackTrace()V

    .line 487
    const/16 v27, -0x1

    move-object/from16 v25, v26

    .end local v26    # "raf":Ljava/io/RandomAccessFile;
    .restart local v25    # "raf":Ljava/io/RandomAccessFile;
    move-object v6, v7

    .end local v7    # "Cookiefile":Ljava/io/File;
    .restart local v6    # "Cookiefile":Ljava/io/File;
    goto :goto_0

    .line 480
    .end local v6    # "Cookiefile":Ljava/io/File;
    .end local v25    # "raf":Ljava/io/RandomAccessFile;
    .restart local v7    # "Cookiefile":Ljava/io/File;
    .restart local v26    # "raf":Ljava/io/RandomAccessFile;
    :catchall_0
    move-exception v27

    .line 481
    if-eqz v26, :cond_8

    .line 483
    :try_start_b
    invoke-virtual/range {v26 .. v26}, Ljava/io/RandomAccessFile;->close()V
    :try_end_b
    .catch Ljava/io/IOException; {:try_start_b .. :try_end_b} :catch_3

    .line 490
    :cond_8
    throw v27

    .line 484
    :catch_3
    move-exception v17

    .line 486
    invoke-virtual/range {v17 .. v17}, Ljava/io/IOException;->printStackTrace()V

    .line 487
    const/16 v27, -0x1

    move-object/from16 v25, v26

    .end local v26    # "raf":Ljava/io/RandomAccessFile;
    .restart local v25    # "raf":Ljava/io/RandomAccessFile;
    move-object v6, v7

    .end local v7    # "Cookiefile":Ljava/io/File;
    .restart local v6    # "Cookiefile":Ljava/io/File;
    goto :goto_0

    .line 484
    .end local v6    # "Cookiefile":Ljava/io/File;
    .end local v25    # "raf":Ljava/io/RandomAccessFile;
    .restart local v7    # "Cookiefile":Ljava/io/File;
    .restart local v26    # "raf":Ljava/io/RandomAccessFile;
    :catch_4
    move-exception v17

    .line 486
    invoke-virtual/range {v17 .. v17}, Ljava/io/IOException;->printStackTrace()V

    .line 487
    const/16 v27, -0x1

    move-object/from16 v25, v26

    .end local v26    # "raf":Ljava/io/RandomAccessFile;
    .restart local v25    # "raf":Ljava/io/RandomAccessFile;
    move-object v6, v7

    .end local v7    # "Cookiefile":Ljava/io/File;
    .restart local v6    # "Cookiefile":Ljava/io/File;
    goto :goto_0

    .line 472
    .end local v6    # "Cookiefile":Ljava/io/File;
    .end local v17    # "e":Ljava/io/IOException;
    .end local v25    # "raf":Ljava/io/RandomAccessFile;
    .restart local v7    # "Cookiefile":Ljava/io/File;
    .restart local v26    # "raf":Ljava/io/RandomAccessFile;
    :catchall_1
    move-exception v27

    .line 473
    if-eqz v19, :cond_9

    .line 475
    :try_start_c
    invoke-virtual/range {v19 .. v19}, Ljava/nio/channels/FileChannel;->close()V
    :try_end_c
    .catch Ljava/io/IOException; {:try_start_c .. :try_end_c} :catch_5
    .catchall {:try_start_c .. :try_end_c} :catchall_2

    .line 481
    if-eqz v26, :cond_9

    .line 483
    :try_start_d
    invoke-virtual/range {v26 .. v26}, Ljava/io/RandomAccessFile;->close()V
    :try_end_d
    .catch Ljava/io/IOException; {:try_start_d .. :try_end_d} :catch_8

    .line 492
    :cond_9
    throw v27

    .line 476
    :catch_5
    move-exception v17

    .line 478
    .restart local v17    # "e":Ljava/io/IOException;
    :try_start_e
    invoke-virtual/range {v17 .. v17}, Ljava/io/IOException;->printStackTrace()V
    :try_end_e
    .catchall {:try_start_e .. :try_end_e} :catchall_2

    .line 481
    if-eqz v26, :cond_a

    .line 483
    :try_start_f
    invoke-virtual/range {v26 .. v26}, Ljava/io/RandomAccessFile;->close()V
    :try_end_f
    .catch Ljava/io/IOException; {:try_start_f .. :try_end_f} :catch_6

    .line 479
    :cond_a
    const/16 v27, -0x1

    move-object/from16 v25, v26

    .end local v26    # "raf":Ljava/io/RandomAccessFile;
    .restart local v25    # "raf":Ljava/io/RandomAccessFile;
    move-object v6, v7

    .end local v7    # "Cookiefile":Ljava/io/File;
    .restart local v6    # "Cookiefile":Ljava/io/File;
    goto :goto_0

    .line 484
    .end local v6    # "Cookiefile":Ljava/io/File;
    .end local v25    # "raf":Ljava/io/RandomAccessFile;
    .restart local v7    # "Cookiefile":Ljava/io/File;
    .restart local v26    # "raf":Ljava/io/RandomAccessFile;
    :catch_6
    move-exception v17

    .line 486
    invoke-virtual/range {v17 .. v17}, Ljava/io/IOException;->printStackTrace()V

    .line 487
    const/16 v27, -0x1

    move-object/from16 v25, v26

    .end local v26    # "raf":Ljava/io/RandomAccessFile;
    .restart local v25    # "raf":Ljava/io/RandomAccessFile;
    move-object v6, v7

    .end local v7    # "Cookiefile":Ljava/io/File;
    .restart local v6    # "Cookiefile":Ljava/io/File;
    goto :goto_0

    .line 480
    .end local v6    # "Cookiefile":Ljava/io/File;
    .end local v17    # "e":Ljava/io/IOException;
    .end local v25    # "raf":Ljava/io/RandomAccessFile;
    .restart local v7    # "Cookiefile":Ljava/io/File;
    .restart local v26    # "raf":Ljava/io/RandomAccessFile;
    :catchall_2
    move-exception v27

    .line 481
    if-eqz v26, :cond_b

    .line 483
    :try_start_10
    invoke-virtual/range {v26 .. v26}, Ljava/io/RandomAccessFile;->close()V
    :try_end_10
    .catch Ljava/io/IOException; {:try_start_10 .. :try_end_10} :catch_7

    .line 490
    :cond_b
    throw v27

    .line 484
    :catch_7
    move-exception v17

    .line 486
    .restart local v17    # "e":Ljava/io/IOException;
    invoke-virtual/range {v17 .. v17}, Ljava/io/IOException;->printStackTrace()V

    .line 487
    const/16 v27, -0x1

    move-object/from16 v25, v26

    .end local v26    # "raf":Ljava/io/RandomAccessFile;
    .restart local v25    # "raf":Ljava/io/RandomAccessFile;
    move-object v6, v7

    .end local v7    # "Cookiefile":Ljava/io/File;
    .restart local v6    # "Cookiefile":Ljava/io/File;
    goto :goto_0

    .line 484
    .end local v6    # "Cookiefile":Ljava/io/File;
    .end local v17    # "e":Ljava/io/IOException;
    .end local v25    # "raf":Ljava/io/RandomAccessFile;
    .restart local v7    # "Cookiefile":Ljava/io/File;
    .restart local v26    # "raf":Ljava/io/RandomAccessFile;
    :catch_8
    move-exception v17

    .line 486
    .restart local v17    # "e":Ljava/io/IOException;
    invoke-virtual/range {v17 .. v17}, Ljava/io/IOException;->printStackTrace()V

    .line 487
    const/16 v27, -0x1

    move-object/from16 v25, v26

    .end local v26    # "raf":Ljava/io/RandomAccessFile;
    .restart local v25    # "raf":Ljava/io/RandomAccessFile;
    move-object v6, v7

    .end local v7    # "Cookiefile":Ljava/io/File;
    .restart local v6    # "Cookiefile":Ljava/io/File;
    goto/16 :goto_0

    .line 476
    .end local v6    # "Cookiefile":Ljava/io/File;
    .end local v17    # "e":Ljava/io/IOException;
    .end local v25    # "raf":Ljava/io/RandomAccessFile;
    .restart local v7    # "Cookiefile":Ljava/io/File;
    .restart local v26    # "raf":Ljava/io/RandomAccessFile;
    :catch_9
    move-exception v17

    .line 478
    .restart local v17    # "e":Ljava/io/IOException;
    :try_start_11
    invoke-virtual/range {v17 .. v17}, Ljava/io/IOException;->printStackTrace()V
    :try_end_11
    .catchall {:try_start_11 .. :try_end_11} :catchall_3

    .line 481
    if-eqz v26, :cond_c

    .line 483
    :try_start_12
    invoke-virtual/range {v26 .. v26}, Ljava/io/RandomAccessFile;->close()V
    :try_end_12
    .catch Ljava/io/IOException; {:try_start_12 .. :try_end_12} :catch_a

    .line 479
    :cond_c
    const/16 v27, -0x1

    move-object/from16 v25, v26

    .end local v26    # "raf":Ljava/io/RandomAccessFile;
    .restart local v25    # "raf":Ljava/io/RandomAccessFile;
    move-object v6, v7

    .end local v7    # "Cookiefile":Ljava/io/File;
    .restart local v6    # "Cookiefile":Ljava/io/File;
    goto/16 :goto_0

    .line 484
    .end local v6    # "Cookiefile":Ljava/io/File;
    .end local v25    # "raf":Ljava/io/RandomAccessFile;
    .restart local v7    # "Cookiefile":Ljava/io/File;
    .restart local v26    # "raf":Ljava/io/RandomAccessFile;
    :catch_a
    move-exception v17

    .line 486
    invoke-virtual/range {v17 .. v17}, Ljava/io/IOException;->printStackTrace()V

    .line 487
    const/16 v27, -0x1

    move-object/from16 v25, v26

    .end local v26    # "raf":Ljava/io/RandomAccessFile;
    .restart local v25    # "raf":Ljava/io/RandomAccessFile;
    move-object v6, v7

    .end local v7    # "Cookiefile":Ljava/io/File;
    .restart local v6    # "Cookiefile":Ljava/io/File;
    goto/16 :goto_0

    .line 480
    .end local v6    # "Cookiefile":Ljava/io/File;
    .end local v17    # "e":Ljava/io/IOException;
    .end local v25    # "raf":Ljava/io/RandomAccessFile;
    .restart local v7    # "Cookiefile":Ljava/io/File;
    .restart local v26    # "raf":Ljava/io/RandomAccessFile;
    :catchall_3
    move-exception v27

    .line 481
    if-eqz v26, :cond_d

    .line 483
    :try_start_13
    invoke-virtual/range {v26 .. v26}, Ljava/io/RandomAccessFile;->close()V
    :try_end_13
    .catch Ljava/io/IOException; {:try_start_13 .. :try_end_13} :catch_b

    .line 490
    :cond_d
    throw v27

    .line 484
    :catch_b
    move-exception v17

    .line 486
    .restart local v17    # "e":Ljava/io/IOException;
    invoke-virtual/range {v17 .. v17}, Ljava/io/IOException;->printStackTrace()V

    .line 487
    const/16 v27, -0x1

    move-object/from16 v25, v26

    .end local v26    # "raf":Ljava/io/RandomAccessFile;
    .restart local v25    # "raf":Ljava/io/RandomAccessFile;
    move-object v6, v7

    .end local v7    # "Cookiefile":Ljava/io/File;
    .restart local v6    # "Cookiefile":Ljava/io/File;
    goto/16 :goto_0

    .line 484
    .end local v6    # "Cookiefile":Ljava/io/File;
    .end local v17    # "e":Ljava/io/IOException;
    .end local v25    # "raf":Ljava/io/RandomAccessFile;
    .restart local v7    # "Cookiefile":Ljava/io/File;
    .restart local v26    # "raf":Ljava/io/RandomAccessFile;
    :catch_c
    move-exception v17

    .line 486
    .restart local v17    # "e":Ljava/io/IOException;
    invoke-virtual/range {v17 .. v17}, Ljava/io/IOException;->printStackTrace()V

    .line 487
    const/16 v27, -0x1

    move-object/from16 v25, v26

    .end local v26    # "raf":Ljava/io/RandomAccessFile;
    .restart local v25    # "raf":Ljava/io/RandomAccessFile;
    move-object v6, v7

    .end local v7    # "Cookiefile":Ljava/io/File;
    .restart local v6    # "Cookiefile":Ljava/io/File;
    goto/16 :goto_0

    .line 295
    .end local v6    # "Cookiefile":Ljava/io/File;
    .end local v17    # "e":Ljava/io/IOException;
    .end local v18    # "fileUnzip":Ljava/util/zip/ZipEntry;
    .end local v25    # "raf":Ljava/io/RandomAccessFile;
    .restart local v7    # "Cookiefile":Ljava/io/File;
    .restart local v26    # "raf":Ljava/io/RandomAccessFile;
    :cond_e
    const/16 v27, -0x1

    move/from16 v0, v27

    if-eq v12, v0, :cond_f

    const/16 v27, -0x3

    move/from16 v0, v27

    if-ne v12, v0, :cond_10

    .line 298
    :cond_f
    :try_start_14
    invoke-static {}, Landroid/os/Process;->myPid()I

    move-result v27

    invoke-static/range {v27 .. v27}, Landroid/os/Process;->killProcess(I)V

    .line 299
    const/16 v27, 0x0

    invoke-static/range {v27 .. v27}, Ljava/lang/System;->exit(I)V

    .line 310
    .end local v12    # "compareResult":I
    :cond_10
    new-instance v27, Ljava/lang/StringBuilder;

    invoke-static {v4}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v28

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    sget-object v28, Lcom/wrapper/proxyapplication/Util;->libname:Ljava/lang/String;

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    invoke-static/range {v27 .. v27}, Lcom/wrapper/proxyapplication/Util;->DeleteFile(Ljava/lang/String;)I

    .line 312
    new-instance v27, Ljava/lang/StringBuilder;

    invoke-static {v4}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v28

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    sget-object v28, Lcom/wrapper/proxyapplication/Util;->securename6:Ljava/lang/String;

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    invoke-static/range {v27 .. v27}, Lcom/wrapper/proxyapplication/Util;->DeleteFile(Ljava/lang/String;)I

    .line 316
    const/4 v13, -0x1

    .line 317
    .local v13, "deletedexresult":I
    const/4 v15, -0x1

    .line 318
    .local v15, "deletejarresult":I
    const/16 v16, -0x1

    .line 319
    .local v16, "deleteodexresult":I
    const/4 v14, -0x1

    .line 320
    .local v14, "deleteflagresult":I
    const/16 v20, 0x0

    .line 321
    .local v20, "file_count":I
    const/16 v20, 0x0

    :goto_1
    sget v27, Lcom/wrapper/proxyapplication/Util;->MAX_DEX_NUM:I

    move/from16 v0, v20

    move/from16 v1, v27

    if-lt v0, v1, :cond_19

    .line 350
    :cond_11
    new-instance v27, Ljava/lang/StringBuilder;

    invoke-static {v4}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v28

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    sget-object v28, Lcom/wrapper/proxyapplication/Util;->securename9:Ljava/lang/String;

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    invoke-static/range {v27 .. v27}, Lcom/wrapper/proxyapplication/Util;->DeleteFile(Ljava/lang/String;)I

    .line 351
    new-instance v27, Ljava/lang/StringBuilder;

    invoke-static {v4}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v28

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    sget-object v28, Lcom/wrapper/proxyapplication/Util;->securename5:Ljava/lang/String;

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    invoke-static/range {v27 .. v27}, Lcom/wrapper/proxyapplication/Util;->DeleteFile(Ljava/lang/String;)I

    .line 359
    new-instance v27, Ljava/lang/StringBuilder;

    const-string v28, "assets/"

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    sget-object v28, Lcom/wrapper/proxyapplication/Util;->securename5:Ljava/lang/String;

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    new-instance v28, Ljava/io/File;

    new-instance v29, Ljava/lang/StringBuilder;

    invoke-static {v4}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v30

    invoke-direct/range {v29 .. v30}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v30, "/"

    invoke-virtual/range {v29 .. v30}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v29

    sget-object v30, Lcom/wrapper/proxyapplication/Util;->securename5:Ljava/lang/String;

    invoke-virtual/range {v29 .. v30}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v29

    invoke-virtual/range {v29 .. v29}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v29

    invoke-direct/range {v28 .. v29}, Ljava/io/File;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, p1

    move-object/from16 v1, v27

    move-object/from16 v2, v28

    invoke-static {v0, v1, v2}, Lcom/wrapper/proxyapplication/Util;->UnzipFile(Ljava/util/zip/ZipFile;Ljava/lang/String;Ljava/io/File;)Z

    .line 361
    new-instance v27, Ljava/lang/StringBuilder;

    const-string v28, "assets/"

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    sget-object v28, Lcom/wrapper/proxyapplication/Util;->libname:Ljava/lang/String;

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    new-instance v28, Ljava/io/File;

    new-instance v29, Ljava/lang/StringBuilder;

    invoke-static {v4}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v30

    invoke-direct/range {v29 .. v30}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v30, "/"

    invoke-virtual/range {v29 .. v30}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v29

    sget-object v30, Lcom/wrapper/proxyapplication/Util;->libname:Ljava/lang/String;

    invoke-virtual/range {v29 .. v30}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v29

    invoke-virtual/range {v29 .. v29}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v29

    invoke-direct/range {v28 .. v29}, Ljava/io/File;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, p1

    move-object/from16 v1, v27

    move-object/from16 v2, v28

    invoke-static {v0, v1, v2}, Lcom/wrapper/proxyapplication/Util;->UnzipFile(Ljava/util/zip/ZipFile;Ljava/lang/String;Ljava/io/File;)Z

    .line 362
    new-instance v27, Ljava/lang/StringBuilder;

    const-string v28, "assets/"

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    sget-object v28, Lcom/wrapper/proxyapplication/Util;->securename6:Ljava/lang/String;

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    new-instance v28, Ljava/io/File;

    new-instance v29, Ljava/lang/StringBuilder;

    invoke-static {v4}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v30

    invoke-direct/range {v29 .. v30}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v30, "/"

    invoke-virtual/range {v29 .. v30}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v29

    sget-object v30, Lcom/wrapper/proxyapplication/Util;->securename6:Ljava/lang/String;

    invoke-virtual/range {v29 .. v30}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v29

    invoke-virtual/range {v29 .. v29}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v29

    invoke-direct/range {v28 .. v29}, Ljava/io/File;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, p1

    move-object/from16 v1, v27

    move-object/from16 v2, v28

    invoke-static {v0, v1, v2}, Lcom/wrapper/proxyapplication/Util;->UnzipFile(Ljava/util/zip/ZipFile;Ljava/lang/String;Ljava/io/File;)Z

    .line 363
    new-instance v27, Ljava/lang/StringBuilder;

    const-string v28, "assets/"

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    sget-object v28, Lcom/wrapper/proxyapplication/Util;->securename7:Ljava/lang/String;

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    new-instance v28, Ljava/io/File;

    new-instance v29, Ljava/lang/StringBuilder;

    invoke-static {v4}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v30

    invoke-direct/range {v29 .. v30}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v30, "/"

    invoke-virtual/range {v29 .. v30}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v29

    sget-object v30, Lcom/wrapper/proxyapplication/Util;->securename7:Ljava/lang/String;

    invoke-virtual/range {v29 .. v30}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v29

    invoke-virtual/range {v29 .. v29}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v29

    invoke-direct/range {v28 .. v29}, Ljava/io/File;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, p1

    move-object/from16 v1, v27

    move-object/from16 v2, v28

    invoke-static {v0, v1, v2}, Lcom/wrapper/proxyapplication/Util;->UnzipFile(Ljava/util/zip/ZipFile;Ljava/lang/String;Ljava/io/File;)Z

    .line 367
    new-instance v27, Ljava/io/File;

    move-object/from16 v0, v27

    invoke-direct {v0, v9}, Ljava/io/File;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, p1

    move-object/from16 v1, v27

    invoke-static {v0, v8, v1}, Lcom/wrapper/proxyapplication/Util;->UnzipFile(Ljava/util/zip/ZipFile;Ljava/lang/String;Ljava/io/File;)Z
    :try_end_14
    .catch Ljava/lang/Exception; {:try_start_14 .. :try_end_14} :catch_36
    .catchall {:try_start_14 .. :try_end_14} :catchall_12

    .line 368
    const/16 v21, 0x0

    .local v21, "file_count2":I
    :goto_2
    move/from16 v0, v21

    move/from16 v1, v20

    if-lt v0, v1, :cond_1d

    .line 401
    :cond_12
    const/16 v22, 0x0

    .local v22, "file_count3":I
    :goto_3
    move/from16 v0, v22

    move/from16 v1, v20

    if-lt v0, v1, :cond_21

    .line 441
    :cond_13
    new-instance v27, Ljava/lang/StringBuilder;

    const-string v28, "assets/"

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, v27

    invoke-virtual {v0, v10}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    move-object/from16 v0, p1

    move-object/from16 v1, v27

    invoke-virtual {v0, v1}, Ljava/util/zip/ZipFile;->getEntry(Ljava/lang/String;)Ljava/util/zip/ZipEntry;

    move-result-object v18

    .line 442
    .restart local v18    # "fileUnzip":Ljava/util/zip/ZipEntry;
    if-eqz v18, :cond_14

    .line 443
    new-instance v27, Ljava/lang/StringBuilder;

    invoke-static {v4}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v28

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    sget-object v28, Lcom/wrapper/proxyapplication/Util;->libname:Ljava/lang/String;

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    invoke-virtual/range {v18 .. v18}, Ljava/util/zip/ZipEntry;->getSize()J

    move-result-wide v28

    invoke-static/range {v27 .. v29}, Lcom/wrapper/proxyapplication/Util;->isFileValid(Ljava/lang/String;J)Z

    move-result v27

    if-nez v27, :cond_14

    .line 444
    new-instance v27, Ljava/lang/StringBuilder;

    const-string v28, "assets/"

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, v27

    invoke-virtual {v0, v10}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    new-instance v28, Ljava/io/File;

    new-instance v29, Ljava/lang/StringBuilder;

    invoke-static {v4}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v30

    invoke-direct/range {v29 .. v30}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v30, "/"

    invoke-virtual/range {v29 .. v30}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v29

    sget-object v30, Lcom/wrapper/proxyapplication/Util;->libname:Ljava/lang/String;

    invoke-virtual/range {v29 .. v30}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v29

    invoke-virtual/range {v29 .. v29}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v29

    invoke-direct/range {v28 .. v29}, Ljava/io/File;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, p1

    move-object/from16 v1, v27

    move-object/from16 v2, v28

    invoke-static {v0, v1, v2}, Lcom/wrapper/proxyapplication/Util;->UnzipFile(Ljava/util/zip/ZipFile;Ljava/lang/String;Ljava/io/File;)Z

    .line 447
    :cond_14
    new-instance v27, Ljava/lang/StringBuilder;

    const-string v28, "assets/"

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, v27

    invoke-virtual {v0, v10}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    move-object/from16 v0, p1

    move-object/from16 v1, v27

    invoke-virtual {v0, v1}, Ljava/util/zip/ZipFile;->getEntry(Ljava/lang/String;)Ljava/util/zip/ZipEntry;

    move-result-object v18

    .line 448
    if-eqz v18, :cond_15

    .line 449
    new-instance v27, Ljava/lang/StringBuilder;

    invoke-static {v4}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v28

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    sget-object v28, Lcom/wrapper/proxyapplication/Util;->securename6:Ljava/lang/String;

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    invoke-virtual/range {v18 .. v18}, Ljava/util/zip/ZipEntry;->getSize()J

    move-result-wide v28

    invoke-static/range {v27 .. v29}, Lcom/wrapper/proxyapplication/Util;->isFileValid(Ljava/lang/String;J)Z

    move-result v27

    if-nez v27, :cond_15

    .line 450
    new-instance v27, Ljava/lang/StringBuilder;

    const-string v28, "assets/"

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    sget-object v28, Lcom/wrapper/proxyapplication/Util;->securename6:Ljava/lang/String;

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    new-instance v28, Ljava/io/File;

    new-instance v29, Ljava/lang/StringBuilder;

    invoke-static {v4}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v30

    invoke-direct/range {v29 .. v30}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v30, "/"

    invoke-virtual/range {v29 .. v30}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v29

    sget-object v30, Lcom/wrapper/proxyapplication/Util;->securename6:Ljava/lang/String;

    invoke-virtual/range {v29 .. v30}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v29

    invoke-virtual/range {v29 .. v29}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v29

    invoke-direct/range {v28 .. v29}, Ljava/io/File;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, p1

    move-object/from16 v1, v27

    move-object/from16 v2, v28

    invoke-static {v0, v1, v2}, Lcom/wrapper/proxyapplication/Util;->UnzipFile(Ljava/util/zip/ZipFile;Ljava/lang/String;Ljava/io/File;)Z

    .line 453
    :cond_15
    new-instance v27, Ljava/lang/StringBuilder;

    const-string v28, "assets/"

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, v27

    invoke-virtual {v0, v10}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    move-object/from16 v0, p1

    move-object/from16 v1, v27

    invoke-virtual {v0, v1}, Ljava/util/zip/ZipFile;->getEntry(Ljava/lang/String;)Ljava/util/zip/ZipEntry;

    move-result-object v18

    .line 454
    if-eqz v18, :cond_16

    .line 455
    new-instance v27, Ljava/lang/StringBuilder;

    invoke-static {v4}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v28

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    sget-object v28, Lcom/wrapper/proxyapplication/Util;->securename7:Ljava/lang/String;

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    invoke-virtual/range {v18 .. v18}, Ljava/util/zip/ZipEntry;->getSize()J

    move-result-wide v28

    invoke-static/range {v27 .. v29}, Lcom/wrapper/proxyapplication/Util;->isFileValid(Ljava/lang/String;J)Z

    move-result v27

    if-nez v27, :cond_16

    .line 456
    new-instance v27, Ljava/lang/StringBuilder;

    const-string v28, "assets/"

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    sget-object v28, Lcom/wrapper/proxyapplication/Util;->securename7:Ljava/lang/String;

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    new-instance v28, Ljava/io/File;

    new-instance v29, Ljava/lang/StringBuilder;

    invoke-static {v4}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v30

    invoke-direct/range {v29 .. v30}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v30, "/"

    invoke-virtual/range {v29 .. v30}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v29

    sget-object v30, Lcom/wrapper/proxyapplication/Util;->securename7:Ljava/lang/String;

    invoke-virtual/range {v29 .. v30}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v29

    invoke-virtual/range {v29 .. v29}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v29

    invoke-direct/range {v28 .. v29}, Ljava/io/File;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, p1

    move-object/from16 v1, v27

    move-object/from16 v2, v28

    invoke-static {v0, v1, v2}, Lcom/wrapper/proxyapplication/Util;->UnzipFile(Ljava/util/zip/ZipFile;Ljava/lang/String;Ljava/io/File;)Z

    .line 459
    :cond_16
    move-object/from16 v0, p1

    invoke-virtual {v0, v8}, Ljava/util/zip/ZipFile;->getEntry(Ljava/lang/String;)Ljava/util/zip/ZipEntry;

    move-result-object v18

    .line 460
    if-eqz v18, :cond_17

    .line 461
    invoke-virtual/range {v18 .. v18}, Ljava/util/zip/ZipEntry;->getSize()J

    move-result-wide v28

    move-wide/from16 v0, v28

    invoke-static {v9, v0, v1}, Lcom/wrapper/proxyapplication/Util;->isFileValid(Ljava/lang/String;J)Z

    move-result v27

    if-nez v27, :cond_17

    .line 462
    new-instance v27, Ljava/io/File;

    move-object/from16 v0, v27

    invoke-direct {v0, v9}, Ljava/io/File;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, p1

    move-object/from16 v1, v27

    invoke-static {v0, v8, v1}, Lcom/wrapper/proxyapplication/Util;->UnzipFile(Ljava/util/zip/ZipFile;Ljava/lang/String;Ljava/io/File;)Z

    .line 465
    :cond_17
    if-eqz v23, :cond_18

    .line 467
    :try_start_15
    invoke-virtual/range {v23 .. v23}, Ljava/nio/channels/FileLock;->release()V
    :try_end_15
    .catch Ljava/io/IOException; {:try_start_15 .. :try_end_15} :catch_28
    .catchall {:try_start_15 .. :try_end_15} :catchall_e

    .line 473
    if-eqz v19, :cond_18

    .line 475
    :try_start_16
    invoke-virtual/range {v19 .. v19}, Ljava/nio/channels/FileChannel;->close()V
    :try_end_16
    .catch Ljava/io/IOException; {:try_start_16 .. :try_end_16} :catch_31
    .catchall {:try_start_16 .. :try_end_16} :catchall_10

    .line 481
    if-eqz v26, :cond_18

    .line 483
    :try_start_17
    invoke-virtual/range {v26 .. v26}, Ljava/io/RandomAccessFile;->close()V
    :try_end_17
    .catch Ljava/io/IOException; {:try_start_17 .. :try_end_17} :catch_34

    .line 495
    :cond_18
    const/16 v27, 0x0

    move-object/from16 v25, v26

    .end local v26    # "raf":Ljava/io/RandomAccessFile;
    .restart local v25    # "raf":Ljava/io/RandomAccessFile;
    move-object v6, v7

    .end local v7    # "Cookiefile":Ljava/io/File;
    .restart local v6    # "Cookiefile":Ljava/io/File;
    goto/16 :goto_0

    .line 322
    .end local v6    # "Cookiefile":Ljava/io/File;
    .end local v18    # "fileUnzip":Ljava/util/zip/ZipEntry;
    .end local v21    # "file_count2":I
    .end local v22    # "file_count3":I
    .end local v25    # "raf":Ljava/io/RandomAccessFile;
    .restart local v7    # "Cookiefile":Ljava/io/File;
    .restart local v26    # "raf":Ljava/io/RandomAccessFile;
    :cond_19
    :try_start_18
    new-instance v27, Ljava/lang/StringBuilder;

    invoke-static {v4}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v28

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    sget-object v28, Lcom/wrapper/proxyapplication/Util;->securename0:Ljava/lang/String;

    const-string v29, "."

    new-instance v30, Ljava/lang/StringBuilder;

    const-string v31, "_"

    invoke-direct/range {v30 .. v31}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, v30

    move/from16 v1, v20

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object v30

    invoke-virtual/range {v30 .. v30}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v30

    invoke-static/range {v28 .. v30}, Lcom/wrapper/proxyapplication/Util;->CreatenewFileName(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    move-result-object v28

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    invoke-static/range {v27 .. v27}, Lcom/wrapper/proxyapplication/Util;->DeleteFile(Ljava/lang/String;)I

    move-result v13

    .line 323
    new-instance v27, Ljava/lang/StringBuilder;

    invoke-static {v4}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v28

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    sget-object v28, Lcom/wrapper/proxyapplication/Util;->securename1:Ljava/lang/String;

    const-string v29, "."

    new-instance v30, Ljava/lang/StringBuilder;

    const-string v31, "_"

    invoke-direct/range {v30 .. v31}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, v30

    move/from16 v1, v20

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object v30

    invoke-virtual/range {v30 .. v30}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v30

    invoke-static/range {v28 .. v30}, Lcom/wrapper/proxyapplication/Util;->CreatenewFileName(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    move-result-object v28

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    invoke-static/range {v27 .. v27}, Lcom/wrapper/proxyapplication/Util;->DeleteFile(Ljava/lang/String;)I

    move-result v15

    .line 325
    new-instance v27, Ljava/lang/StringBuilder;

    invoke-static {v4}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v28

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    const-string v28, "odexdir"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    sget-object v28, Lcom/wrapper/proxyapplication/Util;->securename0:Ljava/lang/String;

    const-string v29, "."

    new-instance v30, Ljava/lang/StringBuilder;

    const-string v31, "_"

    invoke-direct/range {v30 .. v31}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, v30

    move/from16 v1, v20

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object v30

    invoke-virtual/range {v30 .. v30}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v30

    invoke-static/range {v28 .. v30}, Lcom/wrapper/proxyapplication/Util;->CreatenewFileName(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    move-result-object v28

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    .line 324
    invoke-static/range {v27 .. v27}, Lcom/wrapper/proxyapplication/Util;->DeleteFile(Ljava/lang/String;)I

    move-result v16

    .line 327
    new-instance v27, Ljava/lang/StringBuilder;

    invoke-static {v4}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v28

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    const-string v28, "odexdir"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    sget-object v28, Lcom/wrapper/proxyapplication/Util;->securename8:Ljava/lang/String;

    const-string v29, "."

    new-instance v30, Ljava/lang/StringBuilder;

    const-string v31, "_"

    invoke-direct/range {v30 .. v31}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, v30

    move/from16 v1, v20

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object v30

    invoke-virtual/range {v30 .. v30}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v30

    invoke-static/range {v28 .. v30}, Lcom/wrapper/proxyapplication/Util;->CreatenewFileName(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    move-result-object v28

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    .line 326
    invoke-static/range {v27 .. v27}, Lcom/wrapper/proxyapplication/Util;->DeleteFile(Ljava/lang/String;)I

    move-result v14

    .line 328
    new-instance v27, Ljava/lang/StringBuilder;

    invoke-static {v4}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v28

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    const-string v28, "oat/arm"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    sget-object v28, Lcom/wrapper/proxyapplication/Util;->securename11:Ljava/lang/String;

    const-string v29, "."

    new-instance v30, Ljava/lang/StringBuilder;

    const-string v31, "_"

    invoke-direct/range {v30 .. v31}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, v30

    move/from16 v1, v20

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object v30

    invoke-virtual/range {v30 .. v30}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v30

    invoke-static/range {v28 .. v30}, Lcom/wrapper/proxyapplication/Util;->CreatenewFileName(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    move-result-object v28

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    invoke-static/range {v27 .. v27}, Lcom/wrapper/proxyapplication/Util;->DeleteFile(Ljava/lang/String;)I

    .line 330
    new-instance v27, Ljava/lang/StringBuilder;

    invoke-static {v4}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v28

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    const-string v28, "oat/arm64"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    sget-object v28, Lcom/wrapper/proxyapplication/Util;->securename11:Ljava/lang/String;

    const-string v29, "."

    new-instance v30, Ljava/lang/StringBuilder;

    const-string v31, "_"

    invoke-direct/range {v30 .. v31}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, v30

    move/from16 v1, v20

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object v30

    invoke-virtual/range {v30 .. v30}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v30

    invoke-static/range {v28 .. v30}, Lcom/wrapper/proxyapplication/Util;->CreatenewFileName(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    move-result-object v28

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    .line 329
    invoke-static/range {v27 .. v27}, Lcom/wrapper/proxyapplication/Util;->DeleteFile(Ljava/lang/String;)I

    .line 331
    new-instance v27, Ljava/lang/StringBuilder;

    invoke-static {v4}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v28

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    const-string v28, "oat/arm"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    sget-object v28, Lcom/wrapper/proxyapplication/Util;->securename14:Ljava/lang/String;

    const-string v29, "."

    new-instance v30, Ljava/lang/StringBuilder;

    const-string v31, "_"

    invoke-direct/range {v30 .. v31}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, v30

    move/from16 v1, v20

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object v30

    invoke-virtual/range {v30 .. v30}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v30

    invoke-static/range {v28 .. v30}, Lcom/wrapper/proxyapplication/Util;->CreatenewFileName(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    move-result-object v28

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    invoke-static/range {v27 .. v27}, Lcom/wrapper/proxyapplication/Util;->DeleteFile(Ljava/lang/String;)I

    .line 332
    new-instance v27, Ljava/lang/StringBuilder;

    invoke-static {v4}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v28

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    const-string v28, "oat/arm"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    sget-object v28, Lcom/wrapper/proxyapplication/Util;->securename15:Ljava/lang/String;

    const-string v29, "."

    new-instance v30, Ljava/lang/StringBuilder;

    const-string v31, "_"

    invoke-direct/range {v30 .. v31}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, v30

    move/from16 v1, v20

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object v30

    invoke-virtual/range {v30 .. v30}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v30

    invoke-static/range {v28 .. v30}, Lcom/wrapper/proxyapplication/Util;->CreatenewFileName(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    move-result-object v28

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    invoke-static/range {v27 .. v27}, Lcom/wrapper/proxyapplication/Util;->DeleteFile(Ljava/lang/String;)I

    .line 334
    new-instance v27, Ljava/lang/StringBuilder;

    invoke-static {v4}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v28

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    const-string v28, "oat/arm64"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    sget-object v28, Lcom/wrapper/proxyapplication/Util;->securename14:Ljava/lang/String;

    const-string v29, "."

    new-instance v30, Ljava/lang/StringBuilder;

    const-string v31, "_"

    invoke-direct/range {v30 .. v31}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, v30

    move/from16 v1, v20

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object v30

    invoke-virtual/range {v30 .. v30}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v30

    invoke-static/range {v28 .. v30}, Lcom/wrapper/proxyapplication/Util;->CreatenewFileName(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    move-result-object v28

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    .line 333
    invoke-static/range {v27 .. v27}, Lcom/wrapper/proxyapplication/Util;->DeleteFile(Ljava/lang/String;)I

    .line 336
    new-instance v27, Ljava/lang/StringBuilder;

    invoke-static {v4}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v28

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    const-string v28, "oat/arm64"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    sget-object v28, Lcom/wrapper/proxyapplication/Util;->securename15:Ljava/lang/String;

    const-string v29, "."

    new-instance v30, Ljava/lang/StringBuilder;

    const-string v31, "_"

    invoke-direct/range {v30 .. v31}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, v30

    move/from16 v1, v20

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object v30

    invoke-virtual/range {v30 .. v30}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v30

    invoke-static/range {v28 .. v30}, Lcom/wrapper/proxyapplication/Util;->CreatenewFileName(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    move-result-object v28

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    .line 335
    invoke-static/range {v27 .. v27}, Lcom/wrapper/proxyapplication/Util;->DeleteFile(Ljava/lang/String;)I

    .line 337
    const/16 v27, -0x1

    move/from16 v0, v27

    if-ne v0, v13, :cond_1a

    const/16 v27, -0x1

    move/from16 v0, v27

    if-ne v0, v15, :cond_1a

    .line 338
    const/16 v27, -0x1

    move/from16 v0, v27

    move/from16 v1, v16

    if-eq v0, v1, :cond_11

    .line 341
    :cond_1a
    const/16 v27, -0x2

    move/from16 v0, v27

    if-eq v0, v13, :cond_1b

    const/16 v27, -0x2

    move/from16 v0, v27

    if-eq v0, v15, :cond_1b

    .line 342
    const/16 v27, -0x2

    move/from16 v0, v27

    move/from16 v1, v16

    if-ne v0, v1, :cond_1c

    .line 343
    :cond_1b
    invoke-static {}, Landroid/os/Process;->myPid()I

    move-result v27

    invoke-static/range {v27 .. v27}, Landroid/os/Process;->killProcess(I)V

    .line 344
    const/16 v27, 0x0

    invoke-static/range {v27 .. v27}, Ljava/lang/System;->exit(I)V

    .line 321
    :cond_1c
    add-int/lit8 v20, v20, 0x1

    goto/16 :goto_1

    .line 370
    .restart local v21    # "file_count2":I
    :cond_1d
    new-instance v27, Ljava/lang/StringBuilder;

    invoke-static {v11}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v28

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    sget-object v28, Lcom/wrapper/proxyapplication/Util;->securename0:Ljava/lang/String;

    const-string v29, "."

    new-instance v30, Ljava/lang/StringBuilder;

    const-string v31, "_"

    invoke-direct/range {v30 .. v31}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, v30

    move/from16 v1, v21

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object v30

    invoke-virtual/range {v30 .. v30}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v30

    invoke-static/range {v28 .. v30}, Lcom/wrapper/proxyapplication/Util;->CreatenewFileName(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    move-result-object v28

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    .line 369
    invoke-static/range {v27 .. v27}, Lcom/wrapper/proxyapplication/Util;->DeleteFile(Ljava/lang/String;)I

    move-result v13

    .line 372
    new-instance v27, Ljava/lang/StringBuilder;

    invoke-static {v11}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v28

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    sget-object v28, Lcom/wrapper/proxyapplication/Util;->securename1:Ljava/lang/String;

    const-string v29, "."

    new-instance v30, Ljava/lang/StringBuilder;

    const-string v31, "_"

    invoke-direct/range {v30 .. v31}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, v30

    move/from16 v1, v21

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object v30

    invoke-virtual/range {v30 .. v30}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v30

    invoke-static/range {v28 .. v30}, Lcom/wrapper/proxyapplication/Util;->CreatenewFileName(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    move-result-object v28

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    .line 371
    invoke-static/range {v27 .. v27}, Lcom/wrapper/proxyapplication/Util;->DeleteFile(Ljava/lang/String;)I

    move-result v15

    .line 373
    new-instance v27, Ljava/lang/StringBuilder;

    invoke-static {v11}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v28

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    const-string v28, "odexdir"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    .line 374
    sget-object v28, Lcom/wrapper/proxyapplication/Util;->securename0:Ljava/lang/String;

    const-string v29, "."

    new-instance v30, Ljava/lang/StringBuilder;

    const-string v31, "_"

    invoke-direct/range {v30 .. v31}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, v30

    move/from16 v1, v21

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object v30

    invoke-virtual/range {v30 .. v30}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v30

    invoke-static/range {v28 .. v30}, Lcom/wrapper/proxyapplication/Util;->CreatenewFileName(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    move-result-object v28

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    .line 373
    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    invoke-static/range {v27 .. v27}, Lcom/wrapper/proxyapplication/Util;->DeleteFile(Ljava/lang/String;)I

    move-result v16

    .line 375
    new-instance v27, Ljava/lang/StringBuilder;

    invoke-static {v11}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v28

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    const-string v28, "odexdir"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    .line 376
    sget-object v28, Lcom/wrapper/proxyapplication/Util;->securename8:Ljava/lang/String;

    const-string v29, "."

    new-instance v30, Ljava/lang/StringBuilder;

    const-string v31, "_"

    invoke-direct/range {v30 .. v31}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, v30

    move/from16 v1, v21

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object v30

    invoke-virtual/range {v30 .. v30}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v30

    invoke-static/range {v28 .. v30}, Lcom/wrapper/proxyapplication/Util;->CreatenewFileName(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    move-result-object v28

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    .line 375
    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    invoke-static/range {v27 .. v27}, Lcom/wrapper/proxyapplication/Util;->DeleteFile(Ljava/lang/String;)I

    move-result v14

    .line 377
    new-instance v27, Ljava/lang/StringBuilder;

    invoke-static {v11}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v28

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    const-string v28, "oat/arm"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    .line 378
    sget-object v28, Lcom/wrapper/proxyapplication/Util;->securename11:Ljava/lang/String;

    const-string v29, "."

    new-instance v30, Ljava/lang/StringBuilder;

    const-string v31, "_"

    invoke-direct/range {v30 .. v31}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, v30

    move/from16 v1, v21

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object v30

    invoke-virtual/range {v30 .. v30}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v30

    invoke-static/range {v28 .. v30}, Lcom/wrapper/proxyapplication/Util;->CreatenewFileName(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    move-result-object v28

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    .line 377
    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    invoke-static/range {v27 .. v27}, Lcom/wrapper/proxyapplication/Util;->DeleteFile(Ljava/lang/String;)I

    .line 379
    new-instance v27, Ljava/lang/StringBuilder;

    invoke-static {v11}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v28

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    const-string v28, "oat/arm64"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    .line 380
    sget-object v28, Lcom/wrapper/proxyapplication/Util;->securename11:Ljava/lang/String;

    const-string v29, "."

    new-instance v30, Ljava/lang/StringBuilder;

    const-string v31, "_"

    invoke-direct/range {v30 .. v31}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, v30

    move/from16 v1, v21

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object v30

    invoke-virtual/range {v30 .. v30}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v30

    invoke-static/range {v28 .. v30}, Lcom/wrapper/proxyapplication/Util;->CreatenewFileName(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    move-result-object v28

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    .line 379
    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    invoke-static/range {v27 .. v27}, Lcom/wrapper/proxyapplication/Util;->DeleteFile(Ljava/lang/String;)I

    .line 381
    new-instance v27, Ljava/lang/StringBuilder;

    invoke-static {v11}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v28

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    const-string v28, "oat/arm"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    .line 382
    sget-object v28, Lcom/wrapper/proxyapplication/Util;->securename14:Ljava/lang/String;

    const-string v29, "."

    new-instance v30, Ljava/lang/StringBuilder;

    const-string v31, "_"

    invoke-direct/range {v30 .. v31}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, v30

    move/from16 v1, v21

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object v30

    invoke-virtual/range {v30 .. v30}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v30

    invoke-static/range {v28 .. v30}, Lcom/wrapper/proxyapplication/Util;->CreatenewFileName(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    move-result-object v28

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    .line 381
    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    invoke-static/range {v27 .. v27}, Lcom/wrapper/proxyapplication/Util;->DeleteFile(Ljava/lang/String;)I

    .line 383
    new-instance v27, Ljava/lang/StringBuilder;

    invoke-static {v11}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v28

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    const-string v28, "oat/arm"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    .line 384
    sget-object v28, Lcom/wrapper/proxyapplication/Util;->securename15:Ljava/lang/String;

    const-string v29, "."

    new-instance v30, Ljava/lang/StringBuilder;

    const-string v31, "_"

    invoke-direct/range {v30 .. v31}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, v30

    move/from16 v1, v21

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object v30

    invoke-virtual/range {v30 .. v30}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v30

    invoke-static/range {v28 .. v30}, Lcom/wrapper/proxyapplication/Util;->CreatenewFileName(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    move-result-object v28

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    .line 383
    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    invoke-static/range {v27 .. v27}, Lcom/wrapper/proxyapplication/Util;->DeleteFile(Ljava/lang/String;)I

    .line 385
    new-instance v27, Ljava/lang/StringBuilder;

    invoke-static {v11}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v28

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    const-string v28, "oat/arm64"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    .line 386
    sget-object v28, Lcom/wrapper/proxyapplication/Util;->securename14:Ljava/lang/String;

    const-string v29, "."

    new-instance v30, Ljava/lang/StringBuilder;

    const-string v31, "_"

    invoke-direct/range {v30 .. v31}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, v30

    move/from16 v1, v21

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object v30

    invoke-virtual/range {v30 .. v30}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v30

    invoke-static/range {v28 .. v30}, Lcom/wrapper/proxyapplication/Util;->CreatenewFileName(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    move-result-object v28

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    .line 385
    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    invoke-static/range {v27 .. v27}, Lcom/wrapper/proxyapplication/Util;->DeleteFile(Ljava/lang/String;)I

    .line 387
    new-instance v27, Ljava/lang/StringBuilder;

    invoke-static {v11}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v28

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    const-string v28, "oat/arm64"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    .line 388
    sget-object v28, Lcom/wrapper/proxyapplication/Util;->securename15:Ljava/lang/String;

    const-string v29, "."

    new-instance v30, Ljava/lang/StringBuilder;

    const-string v31, "_"

    invoke-direct/range {v30 .. v31}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, v30

    move/from16 v1, v21

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object v30

    invoke-virtual/range {v30 .. v30}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v30

    invoke-static/range {v28 .. v30}, Lcom/wrapper/proxyapplication/Util;->CreatenewFileName(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    move-result-object v28

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    .line 387
    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    invoke-static/range {v27 .. v27}, Lcom/wrapper/proxyapplication/Util;->DeleteFile(Ljava/lang/String;)I

    .line 389
    const/16 v27, -0x1

    move/from16 v0, v27

    if-ne v0, v13, :cond_1e

    const/16 v27, -0x1

    move/from16 v0, v27

    if-ne v0, v15, :cond_1e

    .line 390
    const/16 v27, -0x1

    move/from16 v0, v27

    move/from16 v1, v16

    if-eq v0, v1, :cond_12

    .line 393
    :cond_1e
    const/16 v27, -0x2

    move/from16 v0, v27

    if-eq v0, v13, :cond_1f

    const/16 v27, -0x2

    move/from16 v0, v27

    if-eq v0, v15, :cond_1f

    .line 394
    const/16 v27, -0x2

    move/from16 v0, v27

    move/from16 v1, v16

    if-ne v0, v1, :cond_20

    .line 395
    :cond_1f
    invoke-static {}, Landroid/os/Process;->myPid()I

    move-result v27

    invoke-static/range {v27 .. v27}, Landroid/os/Process;->killProcess(I)V

    .line 396
    const/16 v27, 0x0

    invoke-static/range {v27 .. v27}, Ljava/lang/System;->exit(I)V

    .line 368
    :cond_20
    add-int/lit8 v21, v21, 0x1

    goto/16 :goto_2

    .line 403
    .restart local v22    # "file_count3":I
    :cond_21
    new-instance v27, Ljava/lang/StringBuilder;

    invoke-static/range {v24 .. v24}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v28

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    sget-object v28, Lcom/wrapper/proxyapplication/Util;->securename0:Ljava/lang/String;

    const-string v29, "."

    new-instance v30, Ljava/lang/StringBuilder;

    const-string v31, "_"

    invoke-direct/range {v30 .. v31}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, v30

    move/from16 v1, v22

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object v30

    invoke-virtual/range {v30 .. v30}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v30

    invoke-static/range {v28 .. v30}, Lcom/wrapper/proxyapplication/Util;->CreatenewFileName(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    move-result-object v28

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    .line 402
    invoke-static/range {v27 .. v27}, Lcom/wrapper/proxyapplication/Util;->DeleteFile(Ljava/lang/String;)I

    move-result v13

    .line 405
    new-instance v27, Ljava/lang/StringBuilder;

    invoke-static/range {v24 .. v24}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v28

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    sget-object v28, Lcom/wrapper/proxyapplication/Util;->securename1:Ljava/lang/String;

    const-string v29, "."

    new-instance v30, Ljava/lang/StringBuilder;

    const-string v31, "_"

    invoke-direct/range {v30 .. v31}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, v30

    move/from16 v1, v22

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object v30

    invoke-virtual/range {v30 .. v30}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v30

    invoke-static/range {v28 .. v30}, Lcom/wrapper/proxyapplication/Util;->CreatenewFileName(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    move-result-object v28

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    .line 404
    invoke-static/range {v27 .. v27}, Lcom/wrapper/proxyapplication/Util;->DeleteFile(Ljava/lang/String;)I

    move-result v15

    .line 406
    new-instance v27, Ljava/lang/StringBuilder;

    invoke-static/range {v24 .. v24}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v28

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    const-string v28, "odexdir"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    .line 407
    sget-object v28, Lcom/wrapper/proxyapplication/Util;->securename0:Ljava/lang/String;

    const-string v29, "."

    new-instance v30, Ljava/lang/StringBuilder;

    const-string v31, "_"

    invoke-direct/range {v30 .. v31}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, v30

    move/from16 v1, v22

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object v30

    invoke-virtual/range {v30 .. v30}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v30

    invoke-static/range {v28 .. v30}, Lcom/wrapper/proxyapplication/Util;->CreatenewFileName(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    move-result-object v28

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    .line 406
    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    invoke-static/range {v27 .. v27}, Lcom/wrapper/proxyapplication/Util;->DeleteFile(Ljava/lang/String;)I

    move-result v16

    .line 408
    new-instance v27, Ljava/lang/StringBuilder;

    invoke-static/range {v24 .. v24}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v28

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    const-string v28, "odexdir"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    .line 409
    sget-object v28, Lcom/wrapper/proxyapplication/Util;->securename8:Ljava/lang/String;

    const-string v29, "."

    new-instance v30, Ljava/lang/StringBuilder;

    const-string v31, "_"

    invoke-direct/range {v30 .. v31}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, v30

    move/from16 v1, v22

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object v30

    invoke-virtual/range {v30 .. v30}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v30

    invoke-static/range {v28 .. v30}, Lcom/wrapper/proxyapplication/Util;->CreatenewFileName(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    move-result-object v28

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    .line 408
    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    invoke-static/range {v27 .. v27}, Lcom/wrapper/proxyapplication/Util;->DeleteFile(Ljava/lang/String;)I

    move-result v14

    .line 410
    new-instance v27, Ljava/lang/StringBuilder;

    invoke-static/range {v24 .. v24}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v28

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    const-string v28, "oat/arm"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    .line 411
    sget-object v28, Lcom/wrapper/proxyapplication/Util;->securename11:Ljava/lang/String;

    const-string v29, "."

    new-instance v30, Ljava/lang/StringBuilder;

    const-string v31, "_"

    invoke-direct/range {v30 .. v31}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, v30

    move/from16 v1, v22

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object v30

    invoke-virtual/range {v30 .. v30}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v30

    invoke-static/range {v28 .. v30}, Lcom/wrapper/proxyapplication/Util;->CreatenewFileName(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    move-result-object v28

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    .line 410
    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    invoke-static/range {v27 .. v27}, Lcom/wrapper/proxyapplication/Util;->DeleteFile(Ljava/lang/String;)I

    .line 412
    new-instance v27, Ljava/lang/StringBuilder;

    invoke-static/range {v24 .. v24}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v28

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    const-string v28, "oat/arm64"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    .line 413
    sget-object v28, Lcom/wrapper/proxyapplication/Util;->securename11:Ljava/lang/String;

    const-string v29, "."

    new-instance v30, Ljava/lang/StringBuilder;

    const-string v31, "_"

    invoke-direct/range {v30 .. v31}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, v30

    move/from16 v1, v22

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object v30

    invoke-virtual/range {v30 .. v30}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v30

    invoke-static/range {v28 .. v30}, Lcom/wrapper/proxyapplication/Util;->CreatenewFileName(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    move-result-object v28

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    .line 412
    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    invoke-static/range {v27 .. v27}, Lcom/wrapper/proxyapplication/Util;->DeleteFile(Ljava/lang/String;)I

    .line 414
    new-instance v27, Ljava/lang/StringBuilder;

    invoke-static/range {v24 .. v24}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v28

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    const-string v28, "oat/arm"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    .line 415
    sget-object v28, Lcom/wrapper/proxyapplication/Util;->securename14:Ljava/lang/String;

    const-string v29, "."

    new-instance v30, Ljava/lang/StringBuilder;

    const-string v31, "_"

    invoke-direct/range {v30 .. v31}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, v30

    move/from16 v1, v22

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object v30

    invoke-virtual/range {v30 .. v30}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v30

    invoke-static/range {v28 .. v30}, Lcom/wrapper/proxyapplication/Util;->CreatenewFileName(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    move-result-object v28

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    .line 414
    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    invoke-static/range {v27 .. v27}, Lcom/wrapper/proxyapplication/Util;->DeleteFile(Ljava/lang/String;)I

    .line 416
    new-instance v27, Ljava/lang/StringBuilder;

    invoke-static/range {v24 .. v24}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v28

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    const-string v28, "oat/arm"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    .line 417
    sget-object v28, Lcom/wrapper/proxyapplication/Util;->securename15:Ljava/lang/String;

    const-string v29, "."

    new-instance v30, Ljava/lang/StringBuilder;

    const-string v31, "_"

    invoke-direct/range {v30 .. v31}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, v30

    move/from16 v1, v22

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object v30

    invoke-virtual/range {v30 .. v30}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v30

    invoke-static/range {v28 .. v30}, Lcom/wrapper/proxyapplication/Util;->CreatenewFileName(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    move-result-object v28

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    .line 416
    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    invoke-static/range {v27 .. v27}, Lcom/wrapper/proxyapplication/Util;->DeleteFile(Ljava/lang/String;)I

    .line 418
    new-instance v27, Ljava/lang/StringBuilder;

    invoke-static/range {v24 .. v24}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v28

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    const-string v28, "oat/arm64"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    .line 419
    sget-object v28, Lcom/wrapper/proxyapplication/Util;->securename14:Ljava/lang/String;

    const-string v29, "."

    new-instance v30, Ljava/lang/StringBuilder;

    const-string v31, "_"

    invoke-direct/range {v30 .. v31}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, v30

    move/from16 v1, v22

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object v30

    invoke-virtual/range {v30 .. v30}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v30

    invoke-static/range {v28 .. v30}, Lcom/wrapper/proxyapplication/Util;->CreatenewFileName(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    move-result-object v28

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    .line 418
    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    invoke-static/range {v27 .. v27}, Lcom/wrapper/proxyapplication/Util;->DeleteFile(Ljava/lang/String;)I

    .line 420
    new-instance v27, Ljava/lang/StringBuilder;

    invoke-static/range {v24 .. v24}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v28

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    const-string v28, "oat/arm64"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    .line 421
    sget-object v28, Lcom/wrapper/proxyapplication/Util;->securename15:Ljava/lang/String;

    const-string v29, "."

    new-instance v30, Ljava/lang/StringBuilder;

    const-string v31, "_"

    invoke-direct/range {v30 .. v31}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, v30

    move/from16 v1, v22

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object v30

    invoke-virtual/range {v30 .. v30}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v30

    invoke-static/range {v28 .. v30}, Lcom/wrapper/proxyapplication/Util;->CreatenewFileName(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    move-result-object v28

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    .line 420
    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    invoke-static/range {v27 .. v27}, Lcom/wrapper/proxyapplication/Util;->DeleteFile(Ljava/lang/String;)I

    .line 422
    const/16 v27, -0x1

    move/from16 v0, v27

    if-ne v0, v13, :cond_22

    const/16 v27, -0x1

    move/from16 v0, v27

    if-ne v0, v15, :cond_22

    .line 423
    const/16 v27, -0x1

    move/from16 v0, v27

    move/from16 v1, v16

    if-eq v0, v1, :cond_13

    .line 426
    :cond_22
    const/16 v27, -0x2

    move/from16 v0, v27

    if-eq v0, v13, :cond_23

    const/16 v27, -0x2

    move/from16 v0, v27

    if-eq v0, v15, :cond_23

    .line 427
    const/16 v27, -0x2

    move/from16 v0, v27

    move/from16 v1, v16

    if-ne v0, v1, :cond_24

    .line 428
    :cond_23
    invoke-static {}, Landroid/os/Process;->myPid()I

    move-result v27

    invoke-static/range {v27 .. v27}, Landroid/os/Process;->killProcess(I)V

    .line 429
    const/16 v27, 0x0

    invoke-static/range {v27 .. v27}, Ljava/lang/System;->exit(I)V
    :try_end_18
    .catch Ljava/lang/Exception; {:try_start_18 .. :try_end_18} :catch_36
    .catchall {:try_start_18 .. :try_end_18} :catchall_12

    .line 401
    :cond_24
    add-int/lit8 v22, v22, 0x1

    goto/16 :goto_3

    .line 436
    .end local v7    # "Cookiefile":Ljava/io/File;
    .end local v13    # "deletedexresult":I
    .end local v14    # "deleteflagresult":I
    .end local v15    # "deletejarresult":I
    .end local v16    # "deleteodexresult":I
    .end local v20    # "file_count":I
    .end local v21    # "file_count2":I
    .end local v22    # "file_count3":I
    .end local v26    # "raf":Ljava/io/RandomAccessFile;
    .restart local v6    # "Cookiefile":Ljava/io/File;
    .restart local v25    # "raf":Ljava/io/RandomAccessFile;
    :catch_d
    move-exception v17

    .line 438
    .local v17, "e":Ljava/lang/Exception;
    :goto_4
    :try_start_19
    invoke-virtual/range {v17 .. v17}, Ljava/lang/Exception;->printStackTrace()V
    :try_end_19
    .catchall {:try_start_19 .. :try_end_19} :catchall_8

    .line 441
    new-instance v27, Ljava/lang/StringBuilder;

    const-string v28, "assets/"

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, v27

    invoke-virtual {v0, v10}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    move-object/from16 v0, p1

    move-object/from16 v1, v27

    invoke-virtual {v0, v1}, Ljava/util/zip/ZipFile;->getEntry(Ljava/lang/String;)Ljava/util/zip/ZipEntry;

    move-result-object v18

    .line 442
    .restart local v18    # "fileUnzip":Ljava/util/zip/ZipEntry;
    if-eqz v18, :cond_25

    .line 443
    new-instance v27, Ljava/lang/StringBuilder;

    invoke-static {v4}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v28

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    sget-object v28, Lcom/wrapper/proxyapplication/Util;->libname:Ljava/lang/String;

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    invoke-virtual/range {v18 .. v18}, Ljava/util/zip/ZipEntry;->getSize()J

    move-result-wide v28

    invoke-static/range {v27 .. v29}, Lcom/wrapper/proxyapplication/Util;->isFileValid(Ljava/lang/String;J)Z

    move-result v27

    if-nez v27, :cond_25

    .line 444
    new-instance v27, Ljava/lang/StringBuilder;

    const-string v28, "assets/"

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, v27

    invoke-virtual {v0, v10}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    new-instance v28, Ljava/io/File;

    new-instance v29, Ljava/lang/StringBuilder;

    invoke-static {v4}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v30

    invoke-direct/range {v29 .. v30}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v30, "/"

    invoke-virtual/range {v29 .. v30}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v29

    sget-object v30, Lcom/wrapper/proxyapplication/Util;->libname:Ljava/lang/String;

    invoke-virtual/range {v29 .. v30}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v29

    invoke-virtual/range {v29 .. v29}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v29

    invoke-direct/range {v28 .. v29}, Ljava/io/File;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, p1

    move-object/from16 v1, v27

    move-object/from16 v2, v28

    invoke-static {v0, v1, v2}, Lcom/wrapper/proxyapplication/Util;->UnzipFile(Ljava/util/zip/ZipFile;Ljava/lang/String;Ljava/io/File;)Z

    .line 447
    :cond_25
    new-instance v27, Ljava/lang/StringBuilder;

    const-string v28, "assets/"

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, v27

    invoke-virtual {v0, v10}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    move-object/from16 v0, p1

    move-object/from16 v1, v27

    invoke-virtual {v0, v1}, Ljava/util/zip/ZipFile;->getEntry(Ljava/lang/String;)Ljava/util/zip/ZipEntry;

    move-result-object v18

    .line 448
    if-eqz v18, :cond_26

    .line 449
    new-instance v27, Ljava/lang/StringBuilder;

    invoke-static {v4}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v28

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    sget-object v28, Lcom/wrapper/proxyapplication/Util;->securename6:Ljava/lang/String;

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    invoke-virtual/range {v18 .. v18}, Ljava/util/zip/ZipEntry;->getSize()J

    move-result-wide v28

    invoke-static/range {v27 .. v29}, Lcom/wrapper/proxyapplication/Util;->isFileValid(Ljava/lang/String;J)Z

    move-result v27

    if-nez v27, :cond_26

    .line 450
    new-instance v27, Ljava/lang/StringBuilder;

    const-string v28, "assets/"

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    sget-object v28, Lcom/wrapper/proxyapplication/Util;->securename6:Ljava/lang/String;

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    new-instance v28, Ljava/io/File;

    new-instance v29, Ljava/lang/StringBuilder;

    invoke-static {v4}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v30

    invoke-direct/range {v29 .. v30}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v30, "/"

    invoke-virtual/range {v29 .. v30}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v29

    sget-object v30, Lcom/wrapper/proxyapplication/Util;->securename6:Ljava/lang/String;

    invoke-virtual/range {v29 .. v30}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v29

    invoke-virtual/range {v29 .. v29}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v29

    invoke-direct/range {v28 .. v29}, Ljava/io/File;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, p1

    move-object/from16 v1, v27

    move-object/from16 v2, v28

    invoke-static {v0, v1, v2}, Lcom/wrapper/proxyapplication/Util;->UnzipFile(Ljava/util/zip/ZipFile;Ljava/lang/String;Ljava/io/File;)Z

    .line 453
    :cond_26
    new-instance v27, Ljava/lang/StringBuilder;

    const-string v28, "assets/"

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, v27

    invoke-virtual {v0, v10}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    move-object/from16 v0, p1

    move-object/from16 v1, v27

    invoke-virtual {v0, v1}, Ljava/util/zip/ZipFile;->getEntry(Ljava/lang/String;)Ljava/util/zip/ZipEntry;

    move-result-object v18

    .line 454
    if-eqz v18, :cond_27

    .line 455
    new-instance v27, Ljava/lang/StringBuilder;

    invoke-static {v4}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v28

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v28, "/"

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    sget-object v28, Lcom/wrapper/proxyapplication/Util;->securename7:Ljava/lang/String;

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    invoke-virtual/range {v18 .. v18}, Ljava/util/zip/ZipEntry;->getSize()J

    move-result-wide v28

    invoke-static/range {v27 .. v29}, Lcom/wrapper/proxyapplication/Util;->isFileValid(Ljava/lang/String;J)Z

    move-result v27

    if-nez v27, :cond_27

    .line 456
    new-instance v27, Ljava/lang/StringBuilder;

    const-string v28, "assets/"

    invoke-direct/range {v27 .. v28}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    sget-object v28, Lcom/wrapper/proxyapplication/Util;->securename7:Ljava/lang/String;

    invoke-virtual/range {v27 .. v28}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v27

    invoke-virtual/range {v27 .. v27}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v27

    new-instance v28, Ljava/io/File;

    new-instance v29, Ljava/lang/StringBuilder;

    invoke-static {v4}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v30

    invoke-direct/range {v29 .. v30}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v30, "/"

    invoke-virtual/range {v29 .. v30}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v29

    sget-object v30, Lcom/wrapper/proxyapplication/Util;->securename7:Ljava/lang/String;

    invoke-virtual/range {v29 .. v30}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v29

    invoke-virtual/range {v29 .. v29}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v29

    invoke-direct/range {v28 .. v29}, Ljava/io/File;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, p1

    move-object/from16 v1, v27

    move-object/from16 v2, v28

    invoke-static {v0, v1, v2}, Lcom/wrapper/proxyapplication/Util;->UnzipFile(Ljava/util/zip/ZipFile;Ljava/lang/String;Ljava/io/File;)Z

    .line 459
    :cond_27
    move-object/from16 v0, p1

    invoke-virtual {v0, v8}, Ljava/util/zip/ZipFile;->getEntry(Ljava/lang/String;)Ljava/util/zip/ZipEntry;

    move-result-object v18

    .line 460
    if-eqz v18, :cond_28

    .line 461
    invoke-virtual/range {v18 .. v18}, Ljava/util/zip/ZipEntry;->getSize()J

    move-result-wide v28

    move-wide/from16 v0, v28

    invoke-static {v9, v0, v1}, Lcom/wrapper/proxyapplication/Util;->isFileValid(Ljava/lang/String;J)Z

    move-result v27

    if-nez v27, :cond_28

    .line 462
    new-instance v27, Ljava/io/File;

    move-object/from16 v0, v27

    invoke-direct {v0, v9}, Ljava/io/File;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, p1

    move-object/from16 v1, v27

    invoke-static {v0, v8, v1}, Lcom/wrapper/proxyapplication/Util;->UnzipFile(Ljava/util/zip/ZipFile;Ljava/lang/String;Ljava/io/File;)Z

    .line 465
    :cond_28
    if-eqz v23, :cond_29

    .line 467
    :try_start_1a
    invoke-virtual/range {v23 .. v23}, Ljava/nio/channels/FileLock;->release()V
    :try_end_1a
    .catch Ljava/io/IOException; {:try_start_1a .. :try_end_1a} :catch_e
    .catchall {:try_start_1a .. :try_end_1a} :catchall_5

    .line 473
    if-eqz v19, :cond_29

    .line 475
    :try_start_1b
    invoke-virtual/range {v19 .. v19}, Ljava/nio/channels/FileChannel;->close()V
    :try_end_1b
    .catch Ljava/io/IOException; {:try_start_1b .. :try_end_1b} :catch_17
    .catchall {:try_start_1b .. :try_end_1b} :catchall_7

    .line 481
    if-eqz v25, :cond_29

    .line 483
    :try_start_1c
    invoke-virtual/range {v25 .. v25}, Ljava/io/RandomAccessFile;->close()V
    :try_end_1c
    .catch Ljava/io/IOException; {:try_start_1c .. :try_end_1c} :catch_1a

    .line 439
    :cond_29
    const/16 v27, -0x1

    goto/16 :goto_0

    .line 468
    :catch_e
    move-exception v17

    .line 470
    .local v17, "e":Ljava/io/IOException;
    :try_start_1d
    invoke-virtual/range {v17 .. v17}, Ljava/io/IOException;->printStackTrace()V
    :try_end_1d
    .catchall {:try_start_1d .. :try_end_1d} :catchall_5

    .line 473
    if-eqz v19, :cond_2a

    .line 475
    :try_start_1e
    invoke-virtual/range {v19 .. v19}, Ljava/nio/channels/FileChannel;->close()V
    :try_end_1e
    .catch Ljava/io/IOException; {:try_start_1e .. :try_end_1e} :catch_f
    .catchall {:try_start_1e .. :try_end_1e} :catchall_4

    .line 481
    if-eqz v25, :cond_2a

    .line 483
    :try_start_1f
    invoke-virtual/range {v25 .. v25}, Ljava/io/RandomAccessFile;->close()V
    :try_end_1f
    .catch Ljava/io/IOException; {:try_start_1f .. :try_end_1f} :catch_12

    .line 471
    :cond_2a
    const/16 v27, -0x1

    goto/16 :goto_0

    .line 476
    :catch_f
    move-exception v17

    .line 478
    :try_start_20
    invoke-virtual/range {v17 .. v17}, Ljava/io/IOException;->printStackTrace()V
    :try_end_20
    .catchall {:try_start_20 .. :try_end_20} :catchall_4

    .line 481
    if-eqz v25, :cond_2b

    .line 483
    :try_start_21
    invoke-virtual/range {v25 .. v25}, Ljava/io/RandomAccessFile;->close()V
    :try_end_21
    .catch Ljava/io/IOException; {:try_start_21 .. :try_end_21} :catch_10

    .line 479
    :cond_2b
    const/16 v27, -0x1

    goto/16 :goto_0

    .line 484
    :catch_10
    move-exception v17

    .line 486
    invoke-virtual/range {v17 .. v17}, Ljava/io/IOException;->printStackTrace()V

    .line 487
    const/16 v27, -0x1

    goto/16 :goto_0

    .line 480
    :catchall_4
    move-exception v27

    .line 481
    if-eqz v25, :cond_2c

    .line 483
    :try_start_22
    invoke-virtual/range {v25 .. v25}, Ljava/io/RandomAccessFile;->close()V
    :try_end_22
    .catch Ljava/io/IOException; {:try_start_22 .. :try_end_22} :catch_11

    .line 490
    :cond_2c
    throw v27

    .line 484
    :catch_11
    move-exception v17

    .line 486
    invoke-virtual/range {v17 .. v17}, Ljava/io/IOException;->printStackTrace()V

    .line 487
    const/16 v27, -0x1

    goto/16 :goto_0

    .line 484
    :catch_12
    move-exception v17

    .line 486
    invoke-virtual/range {v17 .. v17}, Ljava/io/IOException;->printStackTrace()V

    .line 487
    const/16 v27, -0x1

    goto/16 :goto_0

    .line 472
    .end local v17    # "e":Ljava/io/IOException;
    :catchall_5
    move-exception v27

    .line 473
    if-eqz v19, :cond_2d

    .line 475
    :try_start_23
    invoke-virtual/range {v19 .. v19}, Ljava/nio/channels/FileChannel;->close()V
    :try_end_23
    .catch Ljava/io/IOException; {:try_start_23 .. :try_end_23} :catch_13
    .catchall {:try_start_23 .. :try_end_23} :catchall_6

    .line 481
    if-eqz v25, :cond_2d

    .line 483
    :try_start_24
    invoke-virtual/range {v25 .. v25}, Ljava/io/RandomAccessFile;->close()V
    :try_end_24
    .catch Ljava/io/IOException; {:try_start_24 .. :try_end_24} :catch_16

    .line 492
    :cond_2d
    throw v27

    .line 476
    :catch_13
    move-exception v17

    .line 478
    .restart local v17    # "e":Ljava/io/IOException;
    :try_start_25
    invoke-virtual/range {v17 .. v17}, Ljava/io/IOException;->printStackTrace()V
    :try_end_25
    .catchall {:try_start_25 .. :try_end_25} :catchall_6

    .line 481
    if-eqz v25, :cond_2e

    .line 483
    :try_start_26
    invoke-virtual/range {v25 .. v25}, Ljava/io/RandomAccessFile;->close()V
    :try_end_26
    .catch Ljava/io/IOException; {:try_start_26 .. :try_end_26} :catch_14

    .line 479
    :cond_2e
    const/16 v27, -0x1

    goto/16 :goto_0

    .line 484
    :catch_14
    move-exception v17

    .line 486
    invoke-virtual/range {v17 .. v17}, Ljava/io/IOException;->printStackTrace()V

    .line 487
    const/16 v27, -0x1

    goto/16 :goto_0

    .line 480
    .end local v17    # "e":Ljava/io/IOException;
    :catchall_6
    move-exception v27

    .line 481
    if-eqz v25, :cond_2f

    .line 483
    :try_start_27
    invoke-virtual/range {v25 .. v25}, Ljava/io/RandomAccessFile;->close()V
    :try_end_27
    .catch Ljava/io/IOException; {:try_start_27 .. :try_end_27} :catch_15

    .line 490
    :cond_2f
    throw v27

    .line 484
    :catch_15
    move-exception v17

    .line 486
    .restart local v17    # "e":Ljava/io/IOException;
    invoke-virtual/range {v17 .. v17}, Ljava/io/IOException;->printStackTrace()V

    .line 487
    const/16 v27, -0x1

    goto/16 :goto_0

    .line 484
    .end local v17    # "e":Ljava/io/IOException;
    :catch_16
    move-exception v17

    .line 486
    .restart local v17    # "e":Ljava/io/IOException;
    invoke-virtual/range {v17 .. v17}, Ljava/io/IOException;->printStackTrace()V

    .line 487
    const/16 v27, -0x1

    goto/16 :goto_0

    .line 476
    .local v17, "e":Ljava/lang/Exception;
    :catch_17
    move-exception v17

    .line 478
    .local v17, "e":Ljava/io/IOException;
    :try_start_28
    invoke-virtual/range {v17 .. v17}, Ljava/io/IOException;->printStackTrace()V
    :try_end_28
    .catchall {:try_start_28 .. :try_end_28} :catchall_7

    .line 481
    if-eqz v25, :cond_30

    .line 483
    :try_start_29
    invoke-virtual/range {v25 .. v25}, Ljava/io/RandomAccessFile;->close()V
    :try_end_29
    .catch Ljava/io/IOException; {:try_start_29 .. :try_end_29} :catch_18

    .line 479
    :cond_30
    const/16 v27, -0x1

    goto/16 :goto_0

    .line 484
    :catch_18
    move-exception v17

    .line 486
    invoke-virtual/range {v17 .. v17}, Ljava/io/IOException;->printStackTrace()V

    .line 487
    const/16 v27, -0x1

    goto/16 :goto_0

    .line 480
    .end local v17    # "e":Ljava/io/IOException;
    :catchall_7
    move-exception v27

    .line 481
    if-eqz v25, :cond_31

    .line 483
    :try_start_2a
    invoke-virtual/range {v25 .. v25}, Ljava/io/RandomAccessFile;->close()V
    :try_end_2a
    .catch Ljava/io/IOException; {:try_start_2a .. :try_end_2a} :catch_19

    .line 490
    :cond_31
    throw v27

    .line 484
    :catch_19
    move-exception v17

    .line 486
    .restart local v17    # "e":Ljava/io/IOException;
    invoke-virtual/range {v17 .. v17}, Ljava/io/IOException;->printStackTrace()V

    .line 487
    const/16 v27, -0x1

    goto/16 :goto_0

    .line 484
    .local v17, "e":Ljava/lang/Exception;
    :catch_1a
    move-exception v17

    .line 486
    .local v17, "e":Ljava/io/IOException;
    invoke-virtual/range {v17 .. v17}, Ljava/io/IOException;->printStackTrace()V

    .line 487
    const/16 v27, -0x1

    goto/16 :goto_0

    .line 440
    .end local v17    # "e":Ljava/io/IOException;
    .end local v18    # "fileUnzip":Ljava/util/zip/ZipEntry;
    :catchall_8
    move-exception v27

    .line 441
    :goto_5
    new-instance v28, Ljava/lang/StringBuilder;

    const-string v29, "assets/"

    invoke-direct/range {v28 .. v29}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, v28

    invoke-virtual {v0, v10}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v28

    invoke-virtual/range {v28 .. v28}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v28

    move-object/from16 v0, p1

    move-object/from16 v1, v28

    invoke-virtual {v0, v1}, Ljava/util/zip/ZipFile;->getEntry(Ljava/lang/String;)Ljava/util/zip/ZipEntry;

    move-result-object v18

    .line 442
    .restart local v18    # "fileUnzip":Ljava/util/zip/ZipEntry;
    if-eqz v18, :cond_32

    .line 443
    new-instance v28, Ljava/lang/StringBuilder;

    invoke-static {v4}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v29

    invoke-direct/range {v28 .. v29}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v29, "/"

    invoke-virtual/range {v28 .. v29}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v28

    sget-object v29, Lcom/wrapper/proxyapplication/Util;->libname:Ljava/lang/String;

    invoke-virtual/range {v28 .. v29}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v28

    invoke-virtual/range {v28 .. v28}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v28

    invoke-virtual/range {v18 .. v18}, Ljava/util/zip/ZipEntry;->getSize()J

    move-result-wide v30

    move-object/from16 v0, v28

    move-wide/from16 v1, v30

    invoke-static {v0, v1, v2}, Lcom/wrapper/proxyapplication/Util;->isFileValid(Ljava/lang/String;J)Z

    move-result v28

    if-nez v28, :cond_32

    .line 444
    new-instance v28, Ljava/lang/StringBuilder;

    const-string v29, "assets/"

    invoke-direct/range {v28 .. v29}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, v28

    invoke-virtual {v0, v10}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v28

    invoke-virtual/range {v28 .. v28}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v28

    new-instance v29, Ljava/io/File;

    new-instance v30, Ljava/lang/StringBuilder;

    invoke-static {v4}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v31

    invoke-direct/range {v30 .. v31}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v31, "/"

    invoke-virtual/range {v30 .. v31}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v30

    sget-object v31, Lcom/wrapper/proxyapplication/Util;->libname:Ljava/lang/String;

    invoke-virtual/range {v30 .. v31}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v30

    invoke-virtual/range {v30 .. v30}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v30

    invoke-direct/range {v29 .. v30}, Ljava/io/File;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, p1

    move-object/from16 v1, v28

    move-object/from16 v2, v29

    invoke-static {v0, v1, v2}, Lcom/wrapper/proxyapplication/Util;->UnzipFile(Ljava/util/zip/ZipFile;Ljava/lang/String;Ljava/io/File;)Z

    .line 447
    :cond_32
    new-instance v28, Ljava/lang/StringBuilder;

    const-string v29, "assets/"

    invoke-direct/range {v28 .. v29}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, v28

    invoke-virtual {v0, v10}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v28

    invoke-virtual/range {v28 .. v28}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v28

    move-object/from16 v0, p1

    move-object/from16 v1, v28

    invoke-virtual {v0, v1}, Ljava/util/zip/ZipFile;->getEntry(Ljava/lang/String;)Ljava/util/zip/ZipEntry;

    move-result-object v18

    .line 448
    if-eqz v18, :cond_33

    .line 449
    new-instance v28, Ljava/lang/StringBuilder;

    invoke-static {v4}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v29

    invoke-direct/range {v28 .. v29}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v29, "/"

    invoke-virtual/range {v28 .. v29}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v28

    sget-object v29, Lcom/wrapper/proxyapplication/Util;->securename6:Ljava/lang/String;

    invoke-virtual/range {v28 .. v29}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v28

    invoke-virtual/range {v28 .. v28}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v28

    invoke-virtual/range {v18 .. v18}, Ljava/util/zip/ZipEntry;->getSize()J

    move-result-wide v30

    move-object/from16 v0, v28

    move-wide/from16 v1, v30

    invoke-static {v0, v1, v2}, Lcom/wrapper/proxyapplication/Util;->isFileValid(Ljava/lang/String;J)Z

    move-result v28

    if-nez v28, :cond_33

    .line 450
    new-instance v28, Ljava/lang/StringBuilder;

    const-string v29, "assets/"

    invoke-direct/range {v28 .. v29}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    sget-object v29, Lcom/wrapper/proxyapplication/Util;->securename6:Ljava/lang/String;

    invoke-virtual/range {v28 .. v29}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v28

    invoke-virtual/range {v28 .. v28}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v28

    new-instance v29, Ljava/io/File;

    new-instance v30, Ljava/lang/StringBuilder;

    invoke-static {v4}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v31

    invoke-direct/range {v30 .. v31}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v31, "/"

    invoke-virtual/range {v30 .. v31}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v30

    sget-object v31, Lcom/wrapper/proxyapplication/Util;->securename6:Ljava/lang/String;

    invoke-virtual/range {v30 .. v31}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v30

    invoke-virtual/range {v30 .. v30}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v30

    invoke-direct/range {v29 .. v30}, Ljava/io/File;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, p1

    move-object/from16 v1, v28

    move-object/from16 v2, v29

    invoke-static {v0, v1, v2}, Lcom/wrapper/proxyapplication/Util;->UnzipFile(Ljava/util/zip/ZipFile;Ljava/lang/String;Ljava/io/File;)Z

    .line 453
    :cond_33
    new-instance v28, Ljava/lang/StringBuilder;

    const-string v29, "assets/"

    invoke-direct/range {v28 .. v29}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, v28

    invoke-virtual {v0, v10}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v28

    invoke-virtual/range {v28 .. v28}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v28

    move-object/from16 v0, p1

    move-object/from16 v1, v28

    invoke-virtual {v0, v1}, Ljava/util/zip/ZipFile;->getEntry(Ljava/lang/String;)Ljava/util/zip/ZipEntry;

    move-result-object v18

    .line 454
    if-eqz v18, :cond_34

    .line 455
    new-instance v28, Ljava/lang/StringBuilder;

    invoke-static {v4}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v29

    invoke-direct/range {v28 .. v29}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v29, "/"

    invoke-virtual/range {v28 .. v29}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v28

    sget-object v29, Lcom/wrapper/proxyapplication/Util;->securename7:Ljava/lang/String;

    invoke-virtual/range {v28 .. v29}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v28

    invoke-virtual/range {v28 .. v28}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v28

    invoke-virtual/range {v18 .. v18}, Ljava/util/zip/ZipEntry;->getSize()J

    move-result-wide v30

    move-object/from16 v0, v28

    move-wide/from16 v1, v30

    invoke-static {v0, v1, v2}, Lcom/wrapper/proxyapplication/Util;->isFileValid(Ljava/lang/String;J)Z

    move-result v28

    if-nez v28, :cond_34

    .line 456
    new-instance v28, Ljava/lang/StringBuilder;

    const-string v29, "assets/"

    invoke-direct/range {v28 .. v29}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    sget-object v29, Lcom/wrapper/proxyapplication/Util;->securename7:Ljava/lang/String;

    invoke-virtual/range {v28 .. v29}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v28

    invoke-virtual/range {v28 .. v28}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v28

    new-instance v29, Ljava/io/File;

    new-instance v30, Ljava/lang/StringBuilder;

    invoke-static {v4}, Ljava/lang/String;->valueOf(Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v31

    invoke-direct/range {v30 .. v31}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    const-string v31, "/"

    invoke-virtual/range {v30 .. v31}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v30

    sget-object v31, Lcom/wrapper/proxyapplication/Util;->securename7:Ljava/lang/String;

    invoke-virtual/range {v30 .. v31}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v30

    invoke-virtual/range {v30 .. v30}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v30

    invoke-direct/range {v29 .. v30}, Ljava/io/File;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, p1

    move-object/from16 v1, v28

    move-object/from16 v2, v29

    invoke-static {v0, v1, v2}, Lcom/wrapper/proxyapplication/Util;->UnzipFile(Ljava/util/zip/ZipFile;Ljava/lang/String;Ljava/io/File;)Z

    .line 459
    :cond_34
    move-object/from16 v0, p1

    invoke-virtual {v0, v8}, Ljava/util/zip/ZipFile;->getEntry(Ljava/lang/String;)Ljava/util/zip/ZipEntry;

    move-result-object v18

    .line 460
    if-eqz v18, :cond_35

    .line 461
    invoke-virtual/range {v18 .. v18}, Ljava/util/zip/ZipEntry;->getSize()J

    move-result-wide v28

    move-wide/from16 v0, v28

    invoke-static {v9, v0, v1}, Lcom/wrapper/proxyapplication/Util;->isFileValid(Ljava/lang/String;J)Z

    move-result v28

    if-nez v28, :cond_35

    .line 462
    new-instance v28, Ljava/io/File;

    move-object/from16 v0, v28

    invoke-direct {v0, v9}, Ljava/io/File;-><init>(Ljava/lang/String;)V

    move-object/from16 v0, p1

    move-object/from16 v1, v28

    invoke-static {v0, v8, v1}, Lcom/wrapper/proxyapplication/Util;->UnzipFile(Ljava/util/zip/ZipFile;Ljava/lang/String;Ljava/io/File;)Z

    .line 465
    :cond_35
    if-eqz v23, :cond_36

    .line 467
    :try_start_2b
    invoke-virtual/range {v23 .. v23}, Ljava/nio/channels/FileLock;->release()V
    :try_end_2b
    .catch Ljava/io/IOException; {:try_start_2b .. :try_end_2b} :catch_1b
    .catchall {:try_start_2b .. :try_end_2b} :catchall_a

    .line 473
    if-eqz v19, :cond_36

    .line 475
    :try_start_2c
    invoke-virtual/range {v19 .. v19}, Ljava/nio/channels/FileChannel;->close()V
    :try_end_2c
    .catch Ljava/io/IOException; {:try_start_2c .. :try_end_2c} :catch_24
    .catchall {:try_start_2c .. :try_end_2c} :catchall_c

    .line 481
    if-eqz v25, :cond_36

    .line 483
    :try_start_2d
    invoke-virtual/range {v25 .. v25}, Ljava/io/RandomAccessFile;->close()V
    :try_end_2d
    .catch Ljava/io/IOException; {:try_start_2d .. :try_end_2d} :catch_27

    .line 494
    :cond_36
    throw v27

    .line 468
    :catch_1b
    move-exception v17

    .line 470
    .restart local v17    # "e":Ljava/io/IOException;
    :try_start_2e
    invoke-virtual/range {v17 .. v17}, Ljava/io/IOException;->printStackTrace()V
    :try_end_2e
    .catchall {:try_start_2e .. :try_end_2e} :catchall_a

    .line 473
    if-eqz v19, :cond_37

    .line 475
    :try_start_2f
    invoke-virtual/range {v19 .. v19}, Ljava/nio/channels/FileChannel;->close()V
    :try_end_2f
    .catch Ljava/io/IOException; {:try_start_2f .. :try_end_2f} :catch_1c
    .catchall {:try_start_2f .. :try_end_2f} :catchall_9

    .line 481
    if-eqz v25, :cond_37

    .line 483
    :try_start_30
    invoke-virtual/range {v25 .. v25}, Ljava/io/RandomAccessFile;->close()V
    :try_end_30
    .catch Ljava/io/IOException; {:try_start_30 .. :try_end_30} :catch_1f

    .line 471
    :cond_37
    const/16 v27, -0x1

    goto/16 :goto_0

    .line 476
    :catch_1c
    move-exception v17

    .line 478
    :try_start_31
    invoke-virtual/range {v17 .. v17}, Ljava/io/IOException;->printStackTrace()V
    :try_end_31
    .catchall {:try_start_31 .. :try_end_31} :catchall_9

    .line 481
    if-eqz v25, :cond_38

    .line 483
    :try_start_32
    invoke-virtual/range {v25 .. v25}, Ljava/io/RandomAccessFile;->close()V
    :try_end_32
    .catch Ljava/io/IOException; {:try_start_32 .. :try_end_32} :catch_1d

    .line 479
    :cond_38
    const/16 v27, -0x1

    goto/16 :goto_0

    .line 484
    :catch_1d
    move-exception v17

    .line 486
    invoke-virtual/range {v17 .. v17}, Ljava/io/IOException;->printStackTrace()V

    .line 487
    const/16 v27, -0x1

    goto/16 :goto_0

    .line 480
    :catchall_9
    move-exception v27

    .line 481
    if-eqz v25, :cond_39

    .line 483
    :try_start_33
    invoke-virtual/range {v25 .. v25}, Ljava/io/RandomAccessFile;->close()V
    :try_end_33
    .catch Ljava/io/IOException; {:try_start_33 .. :try_end_33} :catch_1e

    .line 490
    :cond_39
    throw v27

    .line 484
    :catch_1e
    move-exception v17

    .line 486
    invoke-virtual/range {v17 .. v17}, Ljava/io/IOException;->printStackTrace()V

    .line 487
    const/16 v27, -0x1

    goto/16 :goto_0

    .line 484
    :catch_1f
    move-exception v17

    .line 486
    invoke-virtual/range {v17 .. v17}, Ljava/io/IOException;->printStackTrace()V

    .line 487
    const/16 v27, -0x1

    goto/16 :goto_0

    .line 472
    .end local v17    # "e":Ljava/io/IOException;
    :catchall_a
    move-exception v27

    .line 473
    if-eqz v19, :cond_3a

    .line 475
    :try_start_34
    invoke-virtual/range {v19 .. v19}, Ljava/nio/channels/FileChannel;->close()V
    :try_end_34
    .catch Ljava/io/IOException; {:try_start_34 .. :try_end_34} :catch_20
    .catchall {:try_start_34 .. :try_end_34} :catchall_b

    .line 481
    if-eqz v25, :cond_3a

    .line 483
    :try_start_35
    invoke-virtual/range {v25 .. v25}, Ljava/io/RandomAccessFile;->close()V
    :try_end_35
    .catch Ljava/io/IOException; {:try_start_35 .. :try_end_35} :catch_23

    .line 492
    :cond_3a
    throw v27

    .line 476
    :catch_20
    move-exception v17

    .line 478
    .restart local v17    # "e":Ljava/io/IOException;
    :try_start_36
    invoke-virtual/range {v17 .. v17}, Ljava/io/IOException;->printStackTrace()V
    :try_end_36
    .catchall {:try_start_36 .. :try_end_36} :catchall_b

    .line 481
    if-eqz v25, :cond_3b

    .line 483
    :try_start_37
    invoke-virtual/range {v25 .. v25}, Ljava/io/RandomAccessFile;->close()V
    :try_end_37
    .catch Ljava/io/IOException; {:try_start_37 .. :try_end_37} :catch_21

    .line 479
    :cond_3b
    const/16 v27, -0x1

    goto/16 :goto_0

    .line 484
    :catch_21
    move-exception v17

    .line 486
    invoke-virtual/range {v17 .. v17}, Ljava/io/IOException;->printStackTrace()V

    .line 487
    const/16 v27, -0x1

    goto/16 :goto_0

    .line 480
    .end local v17    # "e":Ljava/io/IOException;
    :catchall_b
    move-exception v27

    .line 481
    if-eqz v25, :cond_3c

    .line 483
    :try_start_38
    invoke-virtual/range {v25 .. v25}, Ljava/io/RandomAccessFile;->close()V
    :try_end_38
    .catch Ljava/io/IOException; {:try_start_38 .. :try_end_38} :catch_22

    .line 490
    :cond_3c
    throw v27

    .line 484
    :catch_22
    move-exception v17

    .line 486
    .restart local v17    # "e":Ljava/io/IOException;
    invoke-virtual/range {v17 .. v17}, Ljava/io/IOException;->printStackTrace()V

    .line 487
    const/16 v27, -0x1

    goto/16 :goto_0

    .line 484
    .end local v17    # "e":Ljava/io/IOException;
    :catch_23
    move-exception v17

    .line 486
    .restart local v17    # "e":Ljava/io/IOException;
    invoke-virtual/range {v17 .. v17}, Ljava/io/IOException;->printStackTrace()V

    .line 487
    const/16 v27, -0x1

    goto/16 :goto_0

    .line 476
    .end local v17    # "e":Ljava/io/IOException;
    :catch_24
    move-exception v17

    .line 478
    .restart local v17    # "e":Ljava/io/IOException;
    :try_start_39
    invoke-virtual/range {v17 .. v17}, Ljava/io/IOException;->printStackTrace()V
    :try_end_39
    .catchall {:try_start_39 .. :try_end_39} :catchall_c

    .line 481
    if-eqz v25, :cond_3d

    .line 483
    :try_start_3a
    invoke-virtual/range {v25 .. v25}, Ljava/io/RandomAccessFile;->close()V
    :try_end_3a
    .catch Ljava/io/IOException; {:try_start_3a .. :try_end_3a} :catch_25

    .line 479
    :cond_3d
    const/16 v27, -0x1

    goto/16 :goto_0

    .line 484
    :catch_25
    move-exception v17

    .line 486
    invoke-virtual/range {v17 .. v17}, Ljava/io/IOException;->printStackTrace()V

    .line 487
    const/16 v27, -0x1

    goto/16 :goto_0

    .line 480
    .end local v17    # "e":Ljava/io/IOException;
    :catchall_c
    move-exception v27

    .line 481
    if-eqz v25, :cond_3e

    .line 483
    :try_start_3b
    invoke-virtual/range {v25 .. v25}, Ljava/io/RandomAccessFile;->close()V
    :try_end_3b
    .catch Ljava/io/IOException; {:try_start_3b .. :try_end_3b} :catch_26

    .line 490
    :cond_3e
    throw v27

    .line 484
    :catch_26
    move-exception v17

    .line 486
    .restart local v17    # "e":Ljava/io/IOException;
    invoke-virtual/range {v17 .. v17}, Ljava/io/IOException;->printStackTrace()V

    .line 487
    const/16 v27, -0x1

    goto/16 :goto_0

    .line 484
    .end local v17    # "e":Ljava/io/IOException;
    :catch_27
    move-exception v17

    .line 486
    .restart local v17    # "e":Ljava/io/IOException;
    invoke-virtual/range {v17 .. v17}, Ljava/io/IOException;->printStackTrace()V

    .line 487
    const/16 v27, -0x1

    goto/16 :goto_0

    .line 468
    .end local v6    # "Cookiefile":Ljava/io/File;
    .end local v17    # "e":Ljava/io/IOException;
    .end local v25    # "raf":Ljava/io/RandomAccessFile;
    .restart local v7    # "Cookiefile":Ljava/io/File;
    .restart local v13    # "deletedexresult":I
    .restart local v14    # "deleteflagresult":I
    .restart local v15    # "deletejarresult":I
    .restart local v16    # "deleteodexresult":I
    .restart local v20    # "file_count":I
    .restart local v21    # "file_count2":I
    .restart local v22    # "file_count3":I
    .restart local v26    # "raf":Ljava/io/RandomAccessFile;
    :catch_28
    move-exception v17

    .line 470
    .restart local v17    # "e":Ljava/io/IOException;
    :try_start_3c
    invoke-virtual/range {v17 .. v17}, Ljava/io/IOException;->printStackTrace()V
    :try_end_3c
    .catchall {:try_start_3c .. :try_end_3c} :catchall_e

    .line 473
    if-eqz v19, :cond_3f

    .line 475
    :try_start_3d
    invoke-virtual/range {v19 .. v19}, Ljava/nio/channels/FileChannel;->close()V
    :try_end_3d
    .catch Ljava/io/IOException; {:try_start_3d .. :try_end_3d} :catch_29
    .catchall {:try_start_3d .. :try_end_3d} :catchall_d

    .line 481
    if-eqz v26, :cond_3f

    .line 483
    :try_start_3e
    invoke-virtual/range {v26 .. v26}, Ljava/io/RandomAccessFile;->close()V
    :try_end_3e
    .catch Ljava/io/IOException; {:try_start_3e .. :try_end_3e} :catch_2c

    .line 471
    :cond_3f
    const/16 v27, -0x1

    move-object/from16 v25, v26

    .end local v26    # "raf":Ljava/io/RandomAccessFile;
    .restart local v25    # "raf":Ljava/io/RandomAccessFile;
    move-object v6, v7

    .end local v7    # "Cookiefile":Ljava/io/File;
    .restart local v6    # "Cookiefile":Ljava/io/File;
    goto/16 :goto_0

    .line 476
    .end local v6    # "Cookiefile":Ljava/io/File;
    .end local v25    # "raf":Ljava/io/RandomAccessFile;
    .restart local v7    # "Cookiefile":Ljava/io/File;
    .restart local v26    # "raf":Ljava/io/RandomAccessFile;
    :catch_29
    move-exception v17

    .line 478
    :try_start_3f
    invoke-virtual/range {v17 .. v17}, Ljava/io/IOException;->printStackTrace()V
    :try_end_3f
    .catchall {:try_start_3f .. :try_end_3f} :catchall_d

    .line 481
    if-eqz v26, :cond_40

    .line 483
    :try_start_40
    invoke-virtual/range {v26 .. v26}, Ljava/io/RandomAccessFile;->close()V
    :try_end_40
    .catch Ljava/io/IOException; {:try_start_40 .. :try_end_40} :catch_2a

    .line 479
    :cond_40
    const/16 v27, -0x1

    move-object/from16 v25, v26

    .end local v26    # "raf":Ljava/io/RandomAccessFile;
    .restart local v25    # "raf":Ljava/io/RandomAccessFile;
    move-object v6, v7

    .end local v7    # "Cookiefile":Ljava/io/File;
    .restart local v6    # "Cookiefile":Ljava/io/File;
    goto/16 :goto_0

    .line 484
    .end local v6    # "Cookiefile":Ljava/io/File;
    .end local v25    # "raf":Ljava/io/RandomAccessFile;
    .restart local v7    # "Cookiefile":Ljava/io/File;
    .restart local v26    # "raf":Ljava/io/RandomAccessFile;
    :catch_2a
    move-exception v17

    .line 486
    invoke-virtual/range {v17 .. v17}, Ljava/io/IOException;->printStackTrace()V

    .line 487
    const/16 v27, -0x1

    move-object/from16 v25, v26

    .end local v26    # "raf":Ljava/io/RandomAccessFile;
    .restart local v25    # "raf":Ljava/io/RandomAccessFile;
    move-object v6, v7

    .end local v7    # "Cookiefile":Ljava/io/File;
    .restart local v6    # "Cookiefile":Ljava/io/File;
    goto/16 :goto_0

    .line 480
    .end local v6    # "Cookiefile":Ljava/io/File;
    .end local v25    # "raf":Ljava/io/RandomAccessFile;
    .restart local v7    # "Cookiefile":Ljava/io/File;
    .restart local v26    # "raf":Ljava/io/RandomAccessFile;
    :catchall_d
    move-exception v27

    .line 481
    if-eqz v26, :cond_41

    .line 483
    :try_start_41
    invoke-virtual/range {v26 .. v26}, Ljava/io/RandomAccessFile;->close()V
    :try_end_41
    .catch Ljava/io/IOException; {:try_start_41 .. :try_end_41} :catch_2b

    .line 490
    :cond_41
    throw v27

    .line 484
    :catch_2b
    move-exception v17

    .line 486
    invoke-virtual/range {v17 .. v17}, Ljava/io/IOException;->printStackTrace()V

    .line 487
    const/16 v27, -0x1

    move-object/from16 v25, v26

    .end local v26    # "raf":Ljava/io/RandomAccessFile;
    .restart local v25    # "raf":Ljava/io/RandomAccessFile;
    move-object v6, v7

    .end local v7    # "Cookiefile":Ljava/io/File;
    .restart local v6    # "Cookiefile":Ljava/io/File;
    goto/16 :goto_0

    .line 484
    .end local v6    # "Cookiefile":Ljava/io/File;
    .end local v25    # "raf":Ljava/io/RandomAccessFile;
    .restart local v7    # "Cookiefile":Ljava/io/File;
    .restart local v26    # "raf":Ljava/io/RandomAccessFile;
    :catch_2c
    move-exception v17

    .line 486
    invoke-virtual/range {v17 .. v17}, Ljava/io/IOException;->printStackTrace()V

    .line 487
    const/16 v27, -0x1

    move-object/from16 v25, v26

    .end local v26    # "raf":Ljava/io/RandomAccessFile;
    .restart local v25    # "raf":Ljava/io/RandomAccessFile;
    move-object v6, v7

    .end local v7    # "Cookiefile":Ljava/io/File;
    .restart local v6    # "Cookiefile":Ljava/io/File;
    goto/16 :goto_0

    .line 472
    .end local v6    # "Cookiefile":Ljava/io/File;
    .end local v17    # "e":Ljava/io/IOException;
    .end local v25    # "raf":Ljava/io/RandomAccessFile;
    .restart local v7    # "Cookiefile":Ljava/io/File;
    .restart local v26    # "raf":Ljava/io/RandomAccessFile;
    :catchall_e
    move-exception v27

    .line 473
    if-eqz v19, :cond_42

    .line 475
    :try_start_42
    invoke-virtual/range {v19 .. v19}, Ljava/nio/channels/FileChannel;->close()V
    :try_end_42
    .catch Ljava/io/IOException; {:try_start_42 .. :try_end_42} :catch_2d
    .catchall {:try_start_42 .. :try_end_42} :catchall_f

    .line 481
    if-eqz v26, :cond_42

    .line 483
    :try_start_43
    invoke-virtual/range {v26 .. v26}, Ljava/io/RandomAccessFile;->close()V
    :try_end_43
    .catch Ljava/io/IOException; {:try_start_43 .. :try_end_43} :catch_30

    .line 492
    :cond_42
    throw v27

    .line 476
    :catch_2d
    move-exception v17

    .line 478
    .restart local v17    # "e":Ljava/io/IOException;
    :try_start_44
    invoke-virtual/range {v17 .. v17}, Ljava/io/IOException;->printStackTrace()V
    :try_end_44
    .catchall {:try_start_44 .. :try_end_44} :catchall_f

    .line 481
    if-eqz v26, :cond_43

    .line 483
    :try_start_45
    invoke-virtual/range {v26 .. v26}, Ljava/io/RandomAccessFile;->close()V
    :try_end_45
    .catch Ljava/io/IOException; {:try_start_45 .. :try_end_45} :catch_2e

    .line 479
    :cond_43
    const/16 v27, -0x1

    move-object/from16 v25, v26

    .end local v26    # "raf":Ljava/io/RandomAccessFile;
    .restart local v25    # "raf":Ljava/io/RandomAccessFile;
    move-object v6, v7

    .end local v7    # "Cookiefile":Ljava/io/File;
    .restart local v6    # "Cookiefile":Ljava/io/File;
    goto/16 :goto_0

    .line 484
    .end local v6    # "Cookiefile":Ljava/io/File;
    .end local v25    # "raf":Ljava/io/RandomAccessFile;
    .restart local v7    # "Cookiefile":Ljava/io/File;
    .restart local v26    # "raf":Ljava/io/RandomAccessFile;
    :catch_2e
    move-exception v17

    .line 486
    invoke-virtual/range {v17 .. v17}, Ljava/io/IOException;->printStackTrace()V

    .line 487
    const/16 v27, -0x1

    move-object/from16 v25, v26

    .end local v26    # "raf":Ljava/io/RandomAccessFile;
    .restart local v25    # "raf":Ljava/io/RandomAccessFile;
    move-object v6, v7

    .end local v7    # "Cookiefile":Ljava/io/File;
    .restart local v6    # "Cookiefile":Ljava/io/File;
    goto/16 :goto_0

    .line 480
    .end local v6    # "Cookiefile":Ljava/io/File;
    .end local v17    # "e":Ljava/io/IOException;
    .end local v25    # "raf":Ljava/io/RandomAccessFile;
    .restart local v7    # "Cookiefile":Ljava/io/File;
    .restart local v26    # "raf":Ljava/io/RandomAccessFile;
    :catchall_f
    move-exception v27

    .line 481
    if-eqz v26, :cond_44

    .line 483
    :try_start_46
    invoke-virtual/range {v26 .. v26}, Ljava/io/RandomAccessFile;->close()V
    :try_end_46
    .catch Ljava/io/IOException; {:try_start_46 .. :try_end_46} :catch_2f

    .line 490
    :cond_44
    throw v27

    .line 484
    :catch_2f
    move-exception v17

    .line 486
    .restart local v17    # "e":Ljava/io/IOException;
    invoke-virtual/range {v17 .. v17}, Ljava/io/IOException;->printStackTrace()V

    .line 487
    const/16 v27, -0x1

    move-object/from16 v25, v26

    .end local v26    # "raf":Ljava/io/RandomAccessFile;
    .restart local v25    # "raf":Ljava/io/RandomAccessFile;
    move-object v6, v7

    .end local v7    # "Cookiefile":Ljava/io/File;
    .restart local v6    # "Cookiefile":Ljava/io/File;
    goto/16 :goto_0

    .line 484
    .end local v6    # "Cookiefile":Ljava/io/File;
    .end local v17    # "e":Ljava/io/IOException;
    .end local v25    # "raf":Ljava/io/RandomAccessFile;
    .restart local v7    # "Cookiefile":Ljava/io/File;
    .restart local v26    # "raf":Ljava/io/RandomAccessFile;
    :catch_30
    move-exception v17

    .line 486
    .restart local v17    # "e":Ljava/io/IOException;
    invoke-virtual/range {v17 .. v17}, Ljava/io/IOException;->printStackTrace()V

    .line 487
    const/16 v27, -0x1

    move-object/from16 v25, v26

    .end local v26    # "raf":Ljava/io/RandomAccessFile;
    .restart local v25    # "raf":Ljava/io/RandomAccessFile;
    move-object v6, v7

    .end local v7    # "Cookiefile":Ljava/io/File;
    .restart local v6    # "Cookiefile":Ljava/io/File;
    goto/16 :goto_0

    .line 476
    .end local v6    # "Cookiefile":Ljava/io/File;
    .end local v17    # "e":Ljava/io/IOException;
    .end local v25    # "raf":Ljava/io/RandomAccessFile;
    .restart local v7    # "Cookiefile":Ljava/io/File;
    .restart local v26    # "raf":Ljava/io/RandomAccessFile;
    :catch_31
    move-exception v17

    .line 478
    .restart local v17    # "e":Ljava/io/IOException;
    :try_start_47
    invoke-virtual/range {v17 .. v17}, Ljava/io/IOException;->printStackTrace()V
    :try_end_47
    .catchall {:try_start_47 .. :try_end_47} :catchall_10

    .line 481
    if-eqz v26, :cond_45

    .line 483
    :try_start_48
    invoke-virtual/range {v26 .. v26}, Ljava/io/RandomAccessFile;->close()V
    :try_end_48
    .catch Ljava/io/IOException; {:try_start_48 .. :try_end_48} :catch_32

    .line 479
    :cond_45
    const/16 v27, -0x1

    move-object/from16 v25, v26

    .end local v26    # "raf":Ljava/io/RandomAccessFile;
    .restart local v25    # "raf":Ljava/io/RandomAccessFile;
    move-object v6, v7

    .end local v7    # "Cookiefile":Ljava/io/File;
    .restart local v6    # "Cookiefile":Ljava/io/File;
    goto/16 :goto_0

    .line 484
    .end local v6    # "Cookiefile":Ljava/io/File;
    .end local v25    # "raf":Ljava/io/RandomAccessFile;
    .restart local v7    # "Cookiefile":Ljava/io/File;
    .restart local v26    # "raf":Ljava/io/RandomAccessFile;
    :catch_32
    move-exception v17

    .line 486
    invoke-virtual/range {v17 .. v17}, Ljava/io/IOException;->printStackTrace()V

    .line 487
    const/16 v27, -0x1

    move-object/from16 v25, v26

    .end local v26    # "raf":Ljava/io/RandomAccessFile;
    .restart local v25    # "raf":Ljava/io/RandomAccessFile;
    move-object v6, v7

    .end local v7    # "Cookiefile":Ljava/io/File;
    .restart local v6    # "Cookiefile":Ljava/io/File;
    goto/16 :goto_0

    .line 480
    .end local v6    # "Cookiefile":Ljava/io/File;
    .end local v17    # "e":Ljava/io/IOException;
    .end local v25    # "raf":Ljava/io/RandomAccessFile;
    .restart local v7    # "Cookiefile":Ljava/io/File;
    .restart local v26    # "raf":Ljava/io/RandomAccessFile;
    :catchall_10
    move-exception v27

    .line 481
    if-eqz v26, :cond_46

    .line 483
    :try_start_49
    invoke-virtual/range {v26 .. v26}, Ljava/io/RandomAccessFile;->close()V
    :try_end_49
    .catch Ljava/io/IOException; {:try_start_49 .. :try_end_49} :catch_33

    .line 490
    :cond_46
    throw v27

    .line 484
    :catch_33
    move-exception v17

    .line 486
    .restart local v17    # "e":Ljava/io/IOException;
    invoke-virtual/range {v17 .. v17}, Ljava/io/IOException;->printStackTrace()V

    .line 487
    const/16 v27, -0x1

    move-object/from16 v25, v26

    .end local v26    # "raf":Ljava/io/RandomAccessFile;
    .restart local v25    # "raf":Ljava/io/RandomAccessFile;
    move-object v6, v7

    .end local v7    # "Cookiefile":Ljava/io/File;
    .restart local v6    # "Cookiefile":Ljava/io/File;
    goto/16 :goto_0

    .line 484
    .end local v6    # "Cookiefile":Ljava/io/File;
    .end local v17    # "e":Ljava/io/IOException;
    .end local v25    # "raf":Ljava/io/RandomAccessFile;
    .restart local v7    # "Cookiefile":Ljava/io/File;
    .restart local v26    # "raf":Ljava/io/RandomAccessFile;
    :catch_34
    move-exception v17

    .line 486
    .restart local v17    # "e":Ljava/io/IOException;
    invoke-virtual/range {v17 .. v17}, Ljava/io/IOException;->printStackTrace()V

    .line 487
    const/16 v27, -0x1

    move-object/from16 v25, v26

    .end local v26    # "raf":Ljava/io/RandomAccessFile;
    .restart local v25    # "raf":Ljava/io/RandomAccessFile;
    move-object v6, v7

    .end local v7    # "Cookiefile":Ljava/io/File;
    .restart local v6    # "Cookiefile":Ljava/io/File;
    goto/16 :goto_0

    .line 440
    .end local v13    # "deletedexresult":I
    .end local v14    # "deleteflagresult":I
    .end local v15    # "deletejarresult":I
    .end local v16    # "deleteodexresult":I
    .end local v17    # "e":Ljava/io/IOException;
    .end local v18    # "fileUnzip":Ljava/util/zip/ZipEntry;
    .end local v20    # "file_count":I
    .end local v21    # "file_count2":I
    .end local v22    # "file_count3":I
    .end local v25    # "raf":Ljava/io/RandomAccessFile;
    .restart local v26    # "raf":Ljava/io/RandomAccessFile;
    :catchall_11
    move-exception v27

    move-object/from16 v25, v26

    .end local v26    # "raf":Ljava/io/RandomAccessFile;
    .restart local v25    # "raf":Ljava/io/RandomAccessFile;
    goto/16 :goto_5

    .end local v6    # "Cookiefile":Ljava/io/File;
    .end local v25    # "raf":Ljava/io/RandomAccessFile;
    .restart local v7    # "Cookiefile":Ljava/io/File;
    .restart local v26    # "raf":Ljava/io/RandomAccessFile;
    :catchall_12
    move-exception v27

    move-object/from16 v25, v26

    .end local v26    # "raf":Ljava/io/RandomAccessFile;
    .restart local v25    # "raf":Ljava/io/RandomAccessFile;
    move-object v6, v7

    .end local v7    # "Cookiefile":Ljava/io/File;
    .restart local v6    # "Cookiefile":Ljava/io/File;
    goto/16 :goto_5

    .line 436
    .end local v25    # "raf":Ljava/io/RandomAccessFile;
    .restart local v26    # "raf":Ljava/io/RandomAccessFile;
    :catch_35
    move-exception v17

    move-object/from16 v25, v26

    .end local v26    # "raf":Ljava/io/RandomAccessFile;
    .restart local v25    # "raf":Ljava/io/RandomAccessFile;
    goto/16 :goto_4

    .end local v6    # "Cookiefile":Ljava/io/File;
    .end local v25    # "raf":Ljava/io/RandomAccessFile;
    .restart local v7    # "Cookiefile":Ljava/io/File;
    .restart local v26    # "raf":Ljava/io/RandomAccessFile;
    :catch_36
    move-exception v17

    move-object/from16 v25, v26

    .end local v26    # "raf":Ljava/io/RandomAccessFile;
    .restart local v25    # "raf":Ljava/io/RandomAccessFile;
    move-object v6, v7

    .end local v7    # "Cookiefile":Ljava/io/File;
    .restart local v6    # "Cookiefile":Ljava/io/File;
    goto/16 :goto_4
.end method

.method public static SafeUnzipFile(Ljava/util/zip/ZipFile;Ljava/lang/String;Ljava/io/File;)Z
    .locals 2
    .param p0, "zf"    # Ljava/util/zip/ZipFile;
    .param p1, "filepathinzip"    # Ljava/lang/String;
    .param p2, "fileinfiledir"    # Ljava/io/File;

    .prologue
    .line 609
    const-wide/16 v0, 0x0

    invoke-static {p0, p1, p2, v0, v1}, Lcom/wrapper/proxyapplication/Util;->SafeUnzipFile(Ljava/util/zip/ZipFile;Ljava/lang/String;Ljava/io/File;J)Z

    move-result v0

    return v0
.end method

.method public static SafeUnzipFile(Ljava/util/zip/ZipFile;Ljava/lang/String;Ljava/io/File;J)Z
    .locals 11
    .param p0, "zf"    # Ljava/util/zip/ZipFile;
    .param p1, "filepathinzip"    # Ljava/lang/String;
    .param p2, "fileinfiledir"    # Ljava/io/File;
    .param p3, "crc"    # J

    .prologue
    .line 613
    const/4 v0, 0x0

    .line 614
    .local v0, "Output_fos":Ljava/io/BufferedOutputStream;
    const/4 v3, 0x0

    .line 615
    .local v3, "bufbr":Ljava/io/BufferedInputStream;
    const/4 v6, 0x0

    .line 616
    .local v6, "ze":Ljava/util/zip/ZipEntry;
    const/4 v2, 0x0

    .line 617
    .local v2, "buf":[B
    const/4 v5, 0x0

    .line 620
    .local v5, "ifoverwrite":Z
    :try_start_0
    invoke-virtual {p0, p1}, Ljava/util/zip/ZipFile;->getEntry(Ljava/lang/String;)Ljava/util/zip/ZipEntry;
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_c
    .catchall {:try_start_0 .. :try_end_0} :catchall_4

    move-result-object v6

    .line 622
    if-nez v6, :cond_3

    .line 652
    if-eqz v0, :cond_0

    .line 654
    :try_start_1
    invoke-virtual {v0}, Ljava/io/BufferedOutputStream;->close()V
    :try_end_1
    .catch Ljava/io/IOException; {:try_start_1 .. :try_end_1} :catch_0
    .catchall {:try_start_1 .. :try_end_1} :catchall_0

    .line 660
    if-eqz v3, :cond_0

    .line 662
    :try_start_2
    invoke-virtual {v3}, Ljava/io/BufferedInputStream;->close()V
    :try_end_2
    .catch Ljava/io/IOException; {:try_start_2 .. :try_end_2} :catch_3

    .line 624
    :cond_0
    const/4 v7, 0x0

    .line 666
    :goto_0
    return v7

    .line 655
    :catch_0
    move-exception v4

    .line 657
    .local v4, "e":Ljava/io/IOException;
    :try_start_3
    invoke-virtual {v4}, Ljava/io/IOException;->printStackTrace()V
    :try_end_3
    .catchall {:try_start_3 .. :try_end_3} :catchall_0

    .line 660
    if-eqz v3, :cond_1

    .line 662
    :try_start_4
    invoke-virtual {v3}, Ljava/io/BufferedInputStream;->close()V
    :try_end_4
    .catch Ljava/io/IOException; {:try_start_4 .. :try_end_4} :catch_1

    .line 658
    :cond_1
    const/4 v7, 0x0

    goto :goto_0

    .line 663
    :catch_1
    move-exception v4

    .line 665
    invoke-virtual {v4}, Ljava/io/IOException;->printStackTrace()V

    .line 666
    const/4 v7, 0x0

    goto :goto_0

    .line 659
    .end local v4    # "e":Ljava/io/IOException;
    :catchall_0
    move-exception v7

    .line 660
    if-eqz v3, :cond_2

    .line 662
    :try_start_5
    invoke-virtual {v3}, Ljava/io/BufferedInputStream;->close()V
    :try_end_5
    .catch Ljava/io/IOException; {:try_start_5 .. :try_end_5} :catch_2

    .line 669
    :cond_2
    throw v7

    .line 663
    :catch_2
    move-exception v4

    .line 665
    .restart local v4    # "e":Ljava/io/IOException;
    invoke-virtual {v4}, Ljava/io/IOException;->printStackTrace()V

    .line 666
    const/4 v7, 0x0

    goto :goto_0

    .line 663
    .end local v4    # "e":Ljava/io/IOException;
    :catch_3
    move-exception v4

    .line 665
    .restart local v4    # "e":Ljava/io/IOException;
    invoke-virtual {v4}, Ljava/io/IOException;->printStackTrace()V

    .line 666
    const/4 v7, 0x0

    goto :goto_0

    .line 626
    .end local v4    # "e":Ljava/io/IOException;
    :cond_3
    const-wide/16 v8, 0x0

    cmp-long v7, p3, v8

    if-eqz v7, :cond_7

    :try_start_6
    invoke-virtual {v6}, Ljava/util/zip/ZipEntry;->getCrc()J
    :try_end_6
    .catch Ljava/lang/Exception; {:try_start_6 .. :try_end_6} :catch_c
    .catchall {:try_start_6 .. :try_end_6} :catchall_4

    move-result-wide v8

    cmp-long v7, v8, p3

    if-nez v7, :cond_7

    .line 652
    if-eqz v0, :cond_4

    .line 654
    :try_start_7
    invoke-virtual {v0}, Ljava/io/BufferedOutputStream;->close()V
    :try_end_7
    .catch Ljava/io/IOException; {:try_start_7 .. :try_end_7} :catch_4
    .catchall {:try_start_7 .. :try_end_7} :catchall_1

    .line 660
    if-eqz v3, :cond_4

    .line 662
    :try_start_8
    invoke-virtual {v3}, Ljava/io/BufferedInputStream;->close()V
    :try_end_8
    .catch Ljava/io/IOException; {:try_start_8 .. :try_end_8} :catch_7

    .line 628
    :cond_4
    const/4 v7, 0x1

    goto :goto_0

    .line 655
    :catch_4
    move-exception v4

    .line 657
    .restart local v4    # "e":Ljava/io/IOException;
    :try_start_9
    invoke-virtual {v4}, Ljava/io/IOException;->printStackTrace()V
    :try_end_9
    .catchall {:try_start_9 .. :try_end_9} :catchall_1

    .line 660
    if-eqz v3, :cond_5

    .line 662
    :try_start_a
    invoke-virtual {v3}, Ljava/io/BufferedInputStream;->close()V
    :try_end_a
    .catch Ljava/io/IOException; {:try_start_a .. :try_end_a} :catch_5

    .line 658
    :cond_5
    const/4 v7, 0x0

    goto :goto_0

    .line 663
    :catch_5
    move-exception v4

    .line 665
    invoke-virtual {v4}, Ljava/io/IOException;->printStackTrace()V

    .line 666
    const/4 v7, 0x0

    goto :goto_0

    .line 659
    .end local v4    # "e":Ljava/io/IOException;
    :catchall_1
    move-exception v7

    .line 660
    if-eqz v3, :cond_6

    .line 662
    :try_start_b
    invoke-virtual {v3}, Ljava/io/BufferedInputStream;->close()V
    :try_end_b
    .catch Ljava/io/IOException; {:try_start_b .. :try_end_b} :catch_6

    .line 669
    :cond_6
    throw v7

    .line 663
    :catch_6
    move-exception v4

    .line 665
    .restart local v4    # "e":Ljava/io/IOException;
    invoke-virtual {v4}, Ljava/io/IOException;->printStackTrace()V

    .line 666
    const/4 v7, 0x0

    goto :goto_0

    .line 663
    .end local v4    # "e":Ljava/io/IOException;
    :catch_7
    move-exception v4

    .line 665
    .restart local v4    # "e":Ljava/io/IOException;
    invoke-virtual {v4}, Ljava/io/IOException;->printStackTrace()V

    .line 666
    const/4 v7, 0x0

    goto :goto_0

    .line 630
    .end local v4    # "e":Ljava/io/IOException;
    :cond_7
    const/4 v5, 0x1

    .line 631
    :try_start_c
    invoke-static {p0, v6}, Lcom/wrapper/proxyapplication/Util;->UnzipFile(Ljava/util/zip/ZipFile;Ljava/util/zip/ZipEntry;)[B

    move-result-object v2

    .line 640
    if-eqz v5, :cond_8

    .line 641
    new-instance v1, Ljava/io/BufferedOutputStream;

    new-instance v7, Ljava/io/FileOutputStream;

    invoke-direct {v7, p2}, Ljava/io/FileOutputStream;-><init>(Ljava/io/File;)V

    invoke-direct {v1, v7}, Ljava/io/BufferedOutputStream;-><init>(Ljava/io/OutputStream;)V
    :try_end_c
    .catch Ljava/lang/Exception; {:try_start_c .. :try_end_c} :catch_c
    .catchall {:try_start_c .. :try_end_c} :catchall_4

    .line 642
    .end local v0    # "Output_fos":Ljava/io/BufferedOutputStream;
    .local v1, "Output_fos":Ljava/io/BufferedOutputStream;
    const/4 v7, 0x0

    :try_start_d
    array-length v8, v2

    invoke-virtual {v1, v2, v7, v8}, Ljava/io/BufferedOutputStream;->write([BII)V
    :try_end_d
    .catch Ljava/lang/Exception; {:try_start_d .. :try_end_d} :catch_15
    .catchall {:try_start_d .. :try_end_d} :catchall_6

    move-object v0, v1

    .line 652
    .end local v1    # "Output_fos":Ljava/io/BufferedOutputStream;
    .restart local v0    # "Output_fos":Ljava/io/BufferedOutputStream;
    :cond_8
    if-eqz v0, :cond_9

    .line 654
    :try_start_e
    invoke-virtual {v0}, Ljava/io/BufferedOutputStream;->close()V
    :try_end_e
    .catch Ljava/io/IOException; {:try_start_e .. :try_end_e} :catch_8
    .catchall {:try_start_e .. :try_end_e} :catchall_2

    .line 660
    if-eqz v3, :cond_9

    .line 662
    :try_start_f
    invoke-virtual {v3}, Ljava/io/BufferedInputStream;->close()V
    :try_end_f
    .catch Ljava/io/IOException; {:try_start_f .. :try_end_f} :catch_b

    .line 645
    :cond_9
    const/4 v7, 0x1

    goto/16 :goto_0

    .line 655
    :catch_8
    move-exception v4

    .line 657
    .restart local v4    # "e":Ljava/io/IOException;
    :try_start_10
    invoke-virtual {v4}, Ljava/io/IOException;->printStackTrace()V
    :try_end_10
    .catchall {:try_start_10 .. :try_end_10} :catchall_2

    .line 660
    if-eqz v3, :cond_a

    .line 662
    :try_start_11
    invoke-virtual {v3}, Ljava/io/BufferedInputStream;->close()V
    :try_end_11
    .catch Ljava/io/IOException; {:try_start_11 .. :try_end_11} :catch_9

    .line 658
    :cond_a
    const/4 v7, 0x0

    goto/16 :goto_0

    .line 663
    :catch_9
    move-exception v4

    .line 665
    invoke-virtual {v4}, Ljava/io/IOException;->printStackTrace()V

    .line 666
    const/4 v7, 0x0

    goto/16 :goto_0

    .line 659
    .end local v4    # "e":Ljava/io/IOException;
    :catchall_2
    move-exception v7

    .line 660
    if-eqz v3, :cond_b

    .line 662
    :try_start_12
    invoke-virtual {v3}, Ljava/io/BufferedInputStream;->close()V
    :try_end_12
    .catch Ljava/io/IOException; {:try_start_12 .. :try_end_12} :catch_a

    .line 669
    :cond_b
    throw v7

    .line 663
    :catch_a
    move-exception v4

    .line 665
    .restart local v4    # "e":Ljava/io/IOException;
    invoke-virtual {v4}, Ljava/io/IOException;->printStackTrace()V

    .line 666
    const/4 v7, 0x0

    goto/16 :goto_0

    .line 663
    .end local v4    # "e":Ljava/io/IOException;
    :catch_b
    move-exception v4

    .line 665
    .restart local v4    # "e":Ljava/io/IOException;
    invoke-virtual {v4}, Ljava/io/IOException;->printStackTrace()V

    .line 666
    const/4 v7, 0x0

    goto/16 :goto_0

    .line 647
    .end local v4    # "e":Ljava/io/IOException;
    :catch_c
    move-exception v4

    .line 649
    .local v4, "e":Ljava/lang/Exception;
    :goto_1
    :try_start_13
    invoke-virtual {v4}, Ljava/lang/Exception;->printStackTrace()V
    :try_end_13
    .catchall {:try_start_13 .. :try_end_13} :catchall_4

    .line 652
    if-eqz v0, :cond_c

    .line 654
    :try_start_14
    invoke-virtual {v0}, Ljava/io/BufferedOutputStream;->close()V
    :try_end_14
    .catch Ljava/io/IOException; {:try_start_14 .. :try_end_14} :catch_d
    .catchall {:try_start_14 .. :try_end_14} :catchall_3

    .line 660
    if-eqz v3, :cond_c

    .line 662
    :try_start_15
    invoke-virtual {v3}, Ljava/io/BufferedInputStream;->close()V
    :try_end_15
    .catch Ljava/io/IOException; {:try_start_15 .. :try_end_15} :catch_10

    .line 650
    :cond_c
    const/4 v7, 0x0

    goto/16 :goto_0

    .line 655
    :catch_d
    move-exception v4

    .line 657
    .local v4, "e":Ljava/io/IOException;
    :try_start_16
    invoke-virtual {v4}, Ljava/io/IOException;->printStackTrace()V
    :try_end_16
    .catchall {:try_start_16 .. :try_end_16} :catchall_3

    .line 660
    if-eqz v3, :cond_d

    .line 662
    :try_start_17
    invoke-virtual {v3}, Ljava/io/BufferedInputStream;->close()V
    :try_end_17
    .catch Ljava/io/IOException; {:try_start_17 .. :try_end_17} :catch_e

    .line 658
    :cond_d
    const/4 v7, 0x0

    goto/16 :goto_0

    .line 663
    :catch_e
    move-exception v4

    .line 665
    invoke-virtual {v4}, Ljava/io/IOException;->printStackTrace()V

    .line 666
    const/4 v7, 0x0

    goto/16 :goto_0

    .line 659
    .end local v4    # "e":Ljava/io/IOException;
    :catchall_3
    move-exception v7

    .line 660
    if-eqz v3, :cond_e

    .line 662
    :try_start_18
    invoke-virtual {v3}, Ljava/io/BufferedInputStream;->close()V
    :try_end_18
    .catch Ljava/io/IOException; {:try_start_18 .. :try_end_18} :catch_f

    .line 669
    :cond_e
    throw v7

    .line 663
    :catch_f
    move-exception v4

    .line 665
    .restart local v4    # "e":Ljava/io/IOException;
    invoke-virtual {v4}, Ljava/io/IOException;->printStackTrace()V

    .line 666
    const/4 v7, 0x0

    goto/16 :goto_0

    .line 663
    .local v4, "e":Ljava/lang/Exception;
    :catch_10
    move-exception v4

    .line 665
    .local v4, "e":Ljava/io/IOException;
    invoke-virtual {v4}, Ljava/io/IOException;->printStackTrace()V

    .line 666
    const/4 v7, 0x0

    goto/16 :goto_0

    .line 651
    .end local v4    # "e":Ljava/io/IOException;
    :catchall_4
    move-exception v7

    .line 652
    :goto_2
    if-eqz v0, :cond_f

    .line 654
    :try_start_19
    invoke-virtual {v0}, Ljava/io/BufferedOutputStream;->close()V
    :try_end_19
    .catch Ljava/io/IOException; {:try_start_19 .. :try_end_19} :catch_11
    .catchall {:try_start_19 .. :try_end_19} :catchall_5

    .line 660
    if-eqz v3, :cond_f

    .line 662
    :try_start_1a
    invoke-virtual {v3}, Ljava/io/BufferedInputStream;->close()V
    :try_end_1a
    .catch Ljava/io/IOException; {:try_start_1a .. :try_end_1a} :catch_14

    .line 671
    :cond_f
    throw v7

    .line 655
    :catch_11
    move-exception v4

    .line 657
    .restart local v4    # "e":Ljava/io/IOException;
    :try_start_1b
    invoke-virtual {v4}, Ljava/io/IOException;->printStackTrace()V
    :try_end_1b
    .catchall {:try_start_1b .. :try_end_1b} :catchall_5

    .line 660
    if-eqz v3, :cond_10

    .line 662
    :try_start_1c
    invoke-virtual {v3}, Ljava/io/BufferedInputStream;->close()V
    :try_end_1c
    .catch Ljava/io/IOException; {:try_start_1c .. :try_end_1c} :catch_12

    .line 658
    :cond_10
    const/4 v7, 0x0

    goto/16 :goto_0

    .line 663
    :catch_12
    move-exception v4

    .line 665
    invoke-virtual {v4}, Ljava/io/IOException;->printStackTrace()V

    .line 666
    const/4 v7, 0x0

    goto/16 :goto_0

    .line 659
    .end local v4    # "e":Ljava/io/IOException;
    :catchall_5
    move-exception v7

    .line 660
    if-eqz v3, :cond_11

    .line 662
    :try_start_1d
    invoke-virtual {v3}, Ljava/io/BufferedInputStream;->close()V
    :try_end_1d
    .catch Ljava/io/IOException; {:try_start_1d .. :try_end_1d} :catch_13

    .line 669
    :cond_11
    throw v7

    .line 663
    :catch_13
    move-exception v4

    .line 665
    .restart local v4    # "e":Ljava/io/IOException;
    invoke-virtual {v4}, Ljava/io/IOException;->printStackTrace()V

    .line 666
    const/4 v7, 0x0

    goto/16 :goto_0

    .line 663
    .end local v4    # "e":Ljava/io/IOException;
    :catch_14
    move-exception v4

    .line 665
    .restart local v4    # "e":Ljava/io/IOException;
    invoke-virtual {v4}, Ljava/io/IOException;->printStackTrace()V

    .line 666
    const/4 v7, 0x0

    goto/16 :goto_0

    .line 651
    .end local v0    # "Output_fos":Ljava/io/BufferedOutputStream;
    .end local v4    # "e":Ljava/io/IOException;
    .restart local v1    # "Output_fos":Ljava/io/BufferedOutputStream;
    :catchall_6
    move-exception v7

    move-object v0, v1

    .end local v1    # "Output_fos":Ljava/io/BufferedOutputStream;
    .restart local v0    # "Output_fos":Ljava/io/BufferedOutputStream;
    goto :goto_2

    .line 647
    .end local v0    # "Output_fos":Ljava/io/BufferedOutputStream;
    .restart local v1    # "Output_fos":Ljava/io/BufferedOutputStream;
    :catch_15
    move-exception v4

    move-object v0, v1

    .end local v1    # "Output_fos":Ljava/io/BufferedOutputStream;
    .restart local v0    # "Output_fos":Ljava/io/BufferedOutputStream;
    goto :goto_1
.end method

.method public static UnzipFile(Ljava/util/zip/ZipFile;Ljava/lang/String;Ljava/io/File;)Z
    .locals 10
    .param p0, "zf"    # Ljava/util/zip/ZipFile;
    .param p1, "filepathinzip"    # Ljava/lang/String;
    .param p2, "fileinfiledir"    # Ljava/io/File;

    .prologue
    const/4 v8, 0x0

    .line 99
    const/4 v0, 0x0

    .line 101
    .local v0, "Output_fos":Ljava/io/BufferedOutputStream;
    const/4 v3, 0x0

    .line 103
    .local v3, "bufbr":Ljava/io/BufferedInputStream;
    const/4 v7, 0x0

    .line 107
    .local v7, "ze":Ljava/util/zip/ZipEntry;
    :try_start_0
    invoke-virtual {p0, p1}, Ljava/util/zip/ZipFile;->getEntry(Ljava/lang/String;)Ljava/util/zip/ZipEntry;
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_11
    .catchall {:try_start_0 .. :try_end_0} :catchall_2

    move-result-object v7

    .line 109
    if-nez v7, :cond_2

    .line 137
    if-eqz v0, :cond_0

    .line 140
    :try_start_1
    invoke-virtual {v0}, Ljava/io/BufferedOutputStream;->close()V
    :try_end_1
    .catch Ljava/io/IOException; {:try_start_1 .. :try_end_1} :catch_0
    .catchall {:try_start_1 .. :try_end_1} :catchall_0

    .line 146
    if-eqz v3, :cond_0

    .line 148
    :try_start_2
    invoke-virtual {v3}, Ljava/io/BufferedInputStream;->close()V
    :try_end_2
    .catch Ljava/io/IOException; {:try_start_2 .. :try_end_2} :catch_3

    .line 158
    :cond_0
    :goto_0
    return v8

    .line 141
    :catch_0
    move-exception v5

    .line 143
    .local v5, "e":Ljava/io/IOException;
    :try_start_3
    invoke-virtual {v5}, Ljava/io/IOException;->printStackTrace()V
    :try_end_3
    .catchall {:try_start_3 .. :try_end_3} :catchall_0

    .line 146
    if-eqz v3, :cond_0

    .line 148
    :try_start_4
    invoke-virtual {v3}, Ljava/io/BufferedInputStream;->close()V
    :try_end_4
    .catch Ljava/io/IOException; {:try_start_4 .. :try_end_4} :catch_1

    goto :goto_0

    .line 149
    :catch_1
    move-exception v5

    .line 151
    invoke-virtual {v5}, Ljava/io/IOException;->printStackTrace()V

    goto :goto_0

    .line 145
    .end local v5    # "e":Ljava/io/IOException;
    :catchall_0
    move-exception v9

    .line 146
    if-eqz v3, :cond_1

    .line 148
    :try_start_5
    invoke-virtual {v3}, Ljava/io/BufferedInputStream;->close()V
    :try_end_5
    .catch Ljava/io/IOException; {:try_start_5 .. :try_end_5} :catch_2

    .line 155
    :cond_1
    throw v9

    .line 149
    :catch_2
    move-exception v5

    .line 151
    .restart local v5    # "e":Ljava/io/IOException;
    invoke-virtual {v5}, Ljava/io/IOException;->printStackTrace()V

    goto :goto_0

    .line 149
    .end local v5    # "e":Ljava/io/IOException;
    :catch_3
    move-exception v5

    .line 151
    .restart local v5    # "e":Ljava/io/IOException;
    invoke-virtual {v5}, Ljava/io/IOException;->printStackTrace()V

    goto :goto_0

    .line 114
    .end local v5    # "e":Ljava/io/IOException;
    :cond_2
    :try_start_6
    new-instance v1, Ljava/io/BufferedOutputStream;

    new-instance v9, Ljava/io/FileOutputStream;

    invoke-direct {v9, p2}, Ljava/io/FileOutputStream;-><init>(Ljava/io/File;)V

    invoke-direct {v1, v9}, Ljava/io/BufferedOutputStream;-><init>(Ljava/io/OutputStream;)V
    :try_end_6
    .catch Ljava/lang/Exception; {:try_start_6 .. :try_end_6} :catch_11
    .catchall {:try_start_6 .. :try_end_6} :catchall_2

    .line 115
    .end local v0    # "Output_fos":Ljava/io/BufferedOutputStream;
    .local v1, "Output_fos":Ljava/io/BufferedOutputStream;
    const/high16 v9, 0x10000

    :try_start_7
    new-array v2, v9, [B

    .line 117
    .local v2, "buf":[B
    new-instance v4, Ljava/io/BufferedInputStream;

    invoke-virtual {p0, v7}, Ljava/util/zip/ZipFile;->getInputStream(Ljava/util/zip/ZipEntry;)Ljava/io/InputStream;

    move-result-object v9

    invoke-direct {v4, v9}, Ljava/io/BufferedInputStream;-><init>(Ljava/io/InputStream;)V
    :try_end_7
    .catch Ljava/lang/Exception; {:try_start_7 .. :try_end_7} :catch_12
    .catchall {:try_start_7 .. :try_end_7} :catchall_5

    .line 120
    .end local v3    # "bufbr":Ljava/io/BufferedInputStream;
    .local v4, "bufbr":Ljava/io/BufferedInputStream;
    :goto_1
    :try_start_8
    invoke-virtual {v4, v2}, Ljava/io/BufferedInputStream;->read([B)I
    :try_end_8
    .catch Ljava/lang/Exception; {:try_start_8 .. :try_end_8} :catch_4
    .catchall {:try_start_8 .. :try_end_8} :catchall_6

    move-result v6

    .line 121
    .local v6, "readlen":I
    if-gez v6, :cond_4

    .line 137
    if-eqz v1, :cond_3

    .line 140
    :try_start_9
    invoke-virtual {v1}, Ljava/io/BufferedOutputStream;->close()V
    :try_end_9
    .catch Ljava/io/IOException; {:try_start_9 .. :try_end_9} :catch_d
    .catchall {:try_start_9 .. :try_end_9} :catchall_4

    .line 146
    if-eqz v4, :cond_3

    .line 148
    :try_start_a
    invoke-virtual {v4}, Ljava/io/BufferedInputStream;->close()V
    :try_end_a
    .catch Ljava/io/IOException; {:try_start_a .. :try_end_a} :catch_10

    .line 158
    :cond_3
    const/4 v8, 0x1

    move-object v3, v4

    .end local v4    # "bufbr":Ljava/io/BufferedInputStream;
    .restart local v3    # "bufbr":Ljava/io/BufferedInputStream;
    move-object v0, v1

    .end local v1    # "Output_fos":Ljava/io/BufferedOutputStream;
    .restart local v0    # "Output_fos":Ljava/io/BufferedOutputStream;
    goto :goto_0

    .line 125
    .end local v0    # "Output_fos":Ljava/io/BufferedOutputStream;
    .end local v3    # "bufbr":Ljava/io/BufferedInputStream;
    .restart local v1    # "Output_fos":Ljava/io/BufferedOutputStream;
    .restart local v4    # "bufbr":Ljava/io/BufferedInputStream;
    :cond_4
    const/4 v9, 0x0

    :try_start_b
    invoke-virtual {v1, v2, v9, v6}, Ljava/io/BufferedOutputStream;->write([BII)V
    :try_end_b
    .catch Ljava/lang/Exception; {:try_start_b .. :try_end_b} :catch_4
    .catchall {:try_start_b .. :try_end_b} :catchall_6

    goto :goto_1

    .line 129
    .end local v6    # "readlen":I
    :catch_4
    move-exception v5

    move-object v3, v4

    .end local v4    # "bufbr":Ljava/io/BufferedInputStream;
    .restart local v3    # "bufbr":Ljava/io/BufferedInputStream;
    move-object v0, v1

    .line 131
    .end local v1    # "Output_fos":Ljava/io/BufferedOutputStream;
    .end local v2    # "buf":[B
    .restart local v0    # "Output_fos":Ljava/io/BufferedOutputStream;
    .local v5, "e":Ljava/lang/Exception;
    :goto_2
    :try_start_c
    invoke-virtual {v5}, Ljava/lang/Exception;->printStackTrace()V
    :try_end_c
    .catchall {:try_start_c .. :try_end_c} :catchall_2

    .line 137
    if-eqz v0, :cond_0

    .line 140
    :try_start_d
    invoke-virtual {v0}, Ljava/io/BufferedOutputStream;->close()V
    :try_end_d
    .catch Ljava/io/IOException; {:try_start_d .. :try_end_d} :catch_6
    .catchall {:try_start_d .. :try_end_d} :catchall_1

    .line 146
    if-eqz v3, :cond_0

    .line 148
    :try_start_e
    invoke-virtual {v3}, Ljava/io/BufferedInputStream;->close()V
    :try_end_e
    .catch Ljava/io/IOException; {:try_start_e .. :try_end_e} :catch_5

    goto :goto_0

    .line 149
    :catch_5
    move-exception v5

    .line 151
    .local v5, "e":Ljava/io/IOException;
    invoke-virtual {v5}, Ljava/io/IOException;->printStackTrace()V

    goto :goto_0

    .line 141
    .local v5, "e":Ljava/lang/Exception;
    :catch_6
    move-exception v5

    .line 143
    .local v5, "e":Ljava/io/IOException;
    :try_start_f
    invoke-virtual {v5}, Ljava/io/IOException;->printStackTrace()V
    :try_end_f
    .catchall {:try_start_f .. :try_end_f} :catchall_1

    .line 146
    if-eqz v3, :cond_0

    .line 148
    :try_start_10
    invoke-virtual {v3}, Ljava/io/BufferedInputStream;->close()V
    :try_end_10
    .catch Ljava/io/IOException; {:try_start_10 .. :try_end_10} :catch_7

    goto :goto_0

    .line 149
    :catch_7
    move-exception v5

    .line 151
    invoke-virtual {v5}, Ljava/io/IOException;->printStackTrace()V

    goto :goto_0

    .line 145
    .end local v5    # "e":Ljava/io/IOException;
    :catchall_1
    move-exception v9

    .line 146
    if-eqz v3, :cond_5

    .line 148
    :try_start_11
    invoke-virtual {v3}, Ljava/io/BufferedInputStream;->close()V
    :try_end_11
    .catch Ljava/io/IOException; {:try_start_11 .. :try_end_11} :catch_8

    .line 155
    :cond_5
    throw v9

    .line 149
    :catch_8
    move-exception v5

    .line 151
    .restart local v5    # "e":Ljava/io/IOException;
    invoke-virtual {v5}, Ljava/io/IOException;->printStackTrace()V

    goto/16 :goto_0

    .line 135
    .end local v5    # "e":Ljava/io/IOException;
    :catchall_2
    move-exception v9

    .line 137
    :goto_3
    if-eqz v0, :cond_6

    .line 140
    :try_start_12
    invoke-virtual {v0}, Ljava/io/BufferedOutputStream;->close()V
    :try_end_12
    .catch Ljava/io/IOException; {:try_start_12 .. :try_end_12} :catch_9
    .catchall {:try_start_12 .. :try_end_12} :catchall_3

    .line 146
    if-eqz v3, :cond_6

    .line 148
    :try_start_13
    invoke-virtual {v3}, Ljava/io/BufferedInputStream;->close()V
    :try_end_13
    .catch Ljava/io/IOException; {:try_start_13 .. :try_end_13} :catch_c

    .line 157
    :cond_6
    throw v9

    .line 141
    :catch_9
    move-exception v5

    .line 143
    .restart local v5    # "e":Ljava/io/IOException;
    :try_start_14
    invoke-virtual {v5}, Ljava/io/IOException;->printStackTrace()V
    :try_end_14
    .catchall {:try_start_14 .. :try_end_14} :catchall_3

    .line 146
    if-eqz v3, :cond_0

    .line 148
    :try_start_15
    invoke-virtual {v3}, Ljava/io/BufferedInputStream;->close()V
    :try_end_15
    .catch Ljava/io/IOException; {:try_start_15 .. :try_end_15} :catch_a

    goto/16 :goto_0

    .line 149
    :catch_a
    move-exception v5

    .line 151
    invoke-virtual {v5}, Ljava/io/IOException;->printStackTrace()V

    goto/16 :goto_0

    .line 145
    .end local v5    # "e":Ljava/io/IOException;
    :catchall_3
    move-exception v9

    .line 146
    if-eqz v3, :cond_7

    .line 148
    :try_start_16
    invoke-virtual {v3}, Ljava/io/BufferedInputStream;->close()V
    :try_end_16
    .catch Ljava/io/IOException; {:try_start_16 .. :try_end_16} :catch_b

    .line 155
    :cond_7
    throw v9

    .line 149
    :catch_b
    move-exception v5

    .line 151
    .restart local v5    # "e":Ljava/io/IOException;
    invoke-virtual {v5}, Ljava/io/IOException;->printStackTrace()V

    goto/16 :goto_0

    .line 149
    .end local v5    # "e":Ljava/io/IOException;
    :catch_c
    move-exception v5

    .line 151
    .restart local v5    # "e":Ljava/io/IOException;
    invoke-virtual {v5}, Ljava/io/IOException;->printStackTrace()V

    goto/16 :goto_0

    .line 141
    .end local v0    # "Output_fos":Ljava/io/BufferedOutputStream;
    .end local v3    # "bufbr":Ljava/io/BufferedInputStream;
    .end local v5    # "e":Ljava/io/IOException;
    .restart local v1    # "Output_fos":Ljava/io/BufferedOutputStream;
    .restart local v2    # "buf":[B
    .restart local v4    # "bufbr":Ljava/io/BufferedInputStream;
    .restart local v6    # "readlen":I
    :catch_d
    move-exception v5

    .line 143
    .restart local v5    # "e":Ljava/io/IOException;
    :try_start_17
    invoke-virtual {v5}, Ljava/io/IOException;->printStackTrace()V
    :try_end_17
    .catchall {:try_start_17 .. :try_end_17} :catchall_4

    .line 146
    if-eqz v4, :cond_8

    .line 148
    :try_start_18
    invoke-virtual {v4}, Ljava/io/BufferedInputStream;->close()V
    :try_end_18
    .catch Ljava/io/IOException; {:try_start_18 .. :try_end_18} :catch_e

    :cond_8
    move-object v3, v4

    .end local v4    # "bufbr":Ljava/io/BufferedInputStream;
    .restart local v3    # "bufbr":Ljava/io/BufferedInputStream;
    move-object v0, v1

    .line 144
    .end local v1    # "Output_fos":Ljava/io/BufferedOutputStream;
    .restart local v0    # "Output_fos":Ljava/io/BufferedOutputStream;
    goto/16 :goto_0

    .line 149
    .end local v0    # "Output_fos":Ljava/io/BufferedOutputStream;
    .end local v3    # "bufbr":Ljava/io/BufferedInputStream;
    .restart local v1    # "Output_fos":Ljava/io/BufferedOutputStream;
    .restart local v4    # "bufbr":Ljava/io/BufferedInputStream;
    :catch_e
    move-exception v5

    .line 151
    invoke-virtual {v5}, Ljava/io/IOException;->printStackTrace()V

    move-object v3, v4

    .end local v4    # "bufbr":Ljava/io/BufferedInputStream;
    .restart local v3    # "bufbr":Ljava/io/BufferedInputStream;
    move-object v0, v1

    .line 152
    .end local v1    # "Output_fos":Ljava/io/BufferedOutputStream;
    .restart local v0    # "Output_fos":Ljava/io/BufferedOutputStream;
    goto/16 :goto_0

    .line 145
    .end local v0    # "Output_fos":Ljava/io/BufferedOutputStream;
    .end local v3    # "bufbr":Ljava/io/BufferedInputStream;
    .end local v5    # "e":Ljava/io/IOException;
    .restart local v1    # "Output_fos":Ljava/io/BufferedOutputStream;
    .restart local v4    # "bufbr":Ljava/io/BufferedInputStream;
    :catchall_4
    move-exception v9

    .line 146
    if-eqz v4, :cond_9

    .line 148
    :try_start_19
    invoke-virtual {v4}, Ljava/io/BufferedInputStream;->close()V
    :try_end_19
    .catch Ljava/io/IOException; {:try_start_19 .. :try_end_19} :catch_f

    .line 155
    :cond_9
    throw v9

    .line 149
    :catch_f
    move-exception v5

    .line 151
    .restart local v5    # "e":Ljava/io/IOException;
    invoke-virtual {v5}, Ljava/io/IOException;->printStackTrace()V

    move-object v3, v4

    .end local v4    # "bufbr":Ljava/io/BufferedInputStream;
    .restart local v3    # "bufbr":Ljava/io/BufferedInputStream;
    move-object v0, v1

    .line 152
    .end local v1    # "Output_fos":Ljava/io/BufferedOutputStream;
    .restart local v0    # "Output_fos":Ljava/io/BufferedOutputStream;
    goto/16 :goto_0

    .line 149
    .end local v0    # "Output_fos":Ljava/io/BufferedOutputStream;
    .end local v3    # "bufbr":Ljava/io/BufferedInputStream;
    .end local v5    # "e":Ljava/io/IOException;
    .restart local v1    # "Output_fos":Ljava/io/BufferedOutputStream;
    .restart local v4    # "bufbr":Ljava/io/BufferedInputStream;
    :catch_10
    move-exception v5

    .line 151
    .restart local v5    # "e":Ljava/io/IOException;
    invoke-virtual {v5}, Ljava/io/IOException;->printStackTrace()V

    move-object v3, v4

    .end local v4    # "bufbr":Ljava/io/BufferedInputStream;
    .restart local v3    # "bufbr":Ljava/io/BufferedInputStream;
    move-object v0, v1

    .line 152
    .end local v1    # "Output_fos":Ljava/io/BufferedOutputStream;
    .restart local v0    # "Output_fos":Ljava/io/BufferedOutputStream;
    goto/16 :goto_0

    .line 135
    .end local v0    # "Output_fos":Ljava/io/BufferedOutputStream;
    .end local v2    # "buf":[B
    .end local v5    # "e":Ljava/io/IOException;
    .end local v6    # "readlen":I
    .restart local v1    # "Output_fos":Ljava/io/BufferedOutputStream;
    :catchall_5
    move-exception v9

    move-object v0, v1

    .end local v1    # "Output_fos":Ljava/io/BufferedOutputStream;
    .restart local v0    # "Output_fos":Ljava/io/BufferedOutputStream;
    goto :goto_3

    .end local v0    # "Output_fos":Ljava/io/BufferedOutputStream;
    .end local v3    # "bufbr":Ljava/io/BufferedInputStream;
    .restart local v1    # "Output_fos":Ljava/io/BufferedOutputStream;
    .restart local v2    # "buf":[B
    .restart local v4    # "bufbr":Ljava/io/BufferedInputStream;
    :catchall_6
    move-exception v9

    move-object v3, v4

    .end local v4    # "bufbr":Ljava/io/BufferedInputStream;
    .restart local v3    # "bufbr":Ljava/io/BufferedInputStream;
    move-object v0, v1

    .end local v1    # "Output_fos":Ljava/io/BufferedOutputStream;
    .restart local v0    # "Output_fos":Ljava/io/BufferedOutputStream;
    goto :goto_3

    .line 129
    .end local v2    # "buf":[B
    :catch_11
    move-exception v5

    goto/16 :goto_2

    .end local v0    # "Output_fos":Ljava/io/BufferedOutputStream;
    .restart local v1    # "Output_fos":Ljava/io/BufferedOutputStream;
    :catch_12
    move-exception v5

    move-object v0, v1

    .end local v1    # "Output_fos":Ljava/io/BufferedOutputStream;
    .restart local v0    # "Output_fos":Ljava/io/BufferedOutputStream;
    goto/16 :goto_2
.end method

.method public static UnzipFile(Ljava/util/zip/ZipFile;Ljava/util/zip/ZipEntry;)[B
    .locals 8
    .param p0, "zf"    # Ljava/util/zip/ZipFile;
    .param p1, "ze"    # Ljava/util/zip/ZipEntry;
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;
        }
    .end annotation

    .prologue
    .line 678
    invoke-virtual {p1}, Ljava/util/zip/ZipEntry;->getSize()J

    move-result-wide v4

    long-to-int v4, v4

    new-array v0, v4, [B

    .line 679
    .local v0, "buf":[B
    new-instance v1, Ljava/io/BufferedInputStream;

    invoke-virtual {p0, p1}, Ljava/util/zip/ZipFile;->getInputStream(Ljava/util/zip/ZipEntry;)Ljava/io/InputStream;

    move-result-object v4

    invoke-direct {v1, v4}, Ljava/io/BufferedInputStream;-><init>(Ljava/io/InputStream;)V

    .line 681
    .local v1, "bufbr":Ljava/io/BufferedInputStream;
    const/4 v3, 0x0

    .line 683
    .local v3, "totallen":I
    :cond_0
    invoke-virtual {p1}, Ljava/util/zip/ZipEntry;->getSize()J

    move-result-wide v4

    long-to-int v4, v4

    sub-int/2addr v4, v3

    invoke-virtual {v1, v0, v3, v4}, Ljava/io/BufferedInputStream;->read([BII)I

    move-result v2

    .line 684
    .local v2, "readlen":I
    if-gez v2, :cond_1

    .line 694
    :goto_0
    invoke-virtual {p1}, Ljava/util/zip/ZipEntry;->getSize()J

    move-result-wide v4

    long-to-int v4, v4

    if-eq v3, v4, :cond_2

    .line 696
    new-instance v4, Ljava/io/IOException;

    const-string v5, "incorrect zip file size"

    invoke-direct {v4, v5}, Ljava/io/IOException;-><init>(Ljava/lang/String;)V

    throw v4

    .line 687
    :cond_1
    add-int/2addr v3, v2

    .line 688
    int-to-long v4, v3

    invoke-virtual {p1}, Ljava/util/zip/ZipEntry;->getSize()J

    move-result-wide v6

    cmp-long v4, v4, v6

    if-nez v4, :cond_0

    goto :goto_0

    .line 698
    :cond_2
    return-object v0
.end method

.method private static checkCopiedFileCrc(Ljava/util/zip/ZipFile;Ljava/lang/String;Ljava/io/File;)Z
    .locals 8
    .param p0, "zf"    # Ljava/util/zip/ZipFile;
    .param p1, "filepathinzip"    # Ljava/lang/String;
    .param p2, "file"    # Ljava/io/File;

    .prologue
    const/4 v4, 0x0

    .line 745
    invoke-static {p2}, Lcom/wrapper/proxyapplication/Util;->getFileCRC32(Ljava/io/File;)J

    move-result-wide v0

    .line 747
    .local v0, "crc":J
    const-wide/16 v6, -0x1

    cmp-long v5, v0, v6

    if-nez v5, :cond_1

    .line 767
    :cond_0
    :goto_0
    return v4

    .line 749
    :cond_1
    const/4 v3, 0x0

    .line 752
    .local v3, "ze":Ljava/util/zip/ZipEntry;
    :try_start_0
    invoke-virtual {p0, p1}, Ljava/util/zip/ZipFile;->getEntry(Ljava/lang/String;)Ljava/util/zip/ZipEntry;

    move-result-object v3

    .line 754
    if-eqz v3, :cond_0

    .line 758
    const-wide/16 v6, 0x0

    cmp-long v5, v0, v6

    if-eqz v5, :cond_0

    invoke-virtual {v3}, Ljava/util/zip/ZipEntry;->getCrc()J
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    move-result-wide v6

    cmp-long v5, v6, v0

    if-nez v5, :cond_0

    .line 761
    const/4 v4, 0x1

    goto :goto_0

    .line 764
    :catch_0
    move-exception v2

    .line 765
    .local v2, "e":Ljava/lang/Exception;
    goto :goto_0
.end method

.method public static deleteDir(Ljava/io/File;)Z
    .locals 6
    .param p0, "file"    # Ljava/io/File;

    .prologue
    .line 226
    const/4 v2, 0x1

    .line 227
    .local v2, "result":Z
    invoke-virtual {p0}, Ljava/io/File;->isDirectory()Z

    move-result v4

    if-eqz v4, :cond_0

    .line 228
    invoke-virtual {p0}, Ljava/io/File;->list()[Ljava/lang/String;

    move-result-object v0

    .line 230
    .local v0, "children":[Ljava/lang/String;
    const/4 v1, 0x0

    .local v1, "i":I
    :goto_0
    array-length v4, v0

    if-lt v1, v4, :cond_2

    .line 238
    .end local v0    # "children":[Ljava/lang/String;
    .end local v1    # "i":I
    :cond_0
    invoke-virtual {p0}, Ljava/io/File;->exists()Z

    move-result v4

    if-eqz v4, :cond_1

    .line 239
    invoke-virtual {p0}, Ljava/io/File;->delete()Z

    move-result v2

    :cond_1
    move v4, v2

    .line 242
    :goto_1
    return v4

    .line 231
    .restart local v0    # "children":[Ljava/lang/String;
    .restart local v1    # "i":I
    :cond_2
    new-instance v4, Ljava/io/File;

    aget-object v5, v0, v1

    invoke-direct {v4, p0, v5}, Ljava/io/File;-><init>(Ljava/io/File;Ljava/lang/String;)V

    invoke-static {v4}, Lcom/wrapper/proxyapplication/Util;->deleteDir(Ljava/io/File;)Z

    move-result v3

    .line 232
    .local v3, "success":Z
    if-nez v3, :cond_3

    .line 233
    const/4 v4, 0x0

    goto :goto_1

    .line 230
    :cond_3
    add-int/lit8 v1, v1, 0x1

    goto :goto_0
.end method

.method public static getCRC32(Ljava/io/File;)J
    .locals 10
    .param p0, "fileUri"    # Ljava/io/File;

    .prologue
    .line 560
    new-instance v5, Ljava/util/zip/CRC32;

    invoke-direct {v5}, Ljava/util/zip/CRC32;-><init>()V

    .line 562
    .local v5, "crc32":Ljava/util/zip/CRC32;
    const/4 v1, 0x0

    .line 563
    .local v1, "bufbr":Ljava/io/BufferedInputStream;
    const/4 v3, 0x0

    .line 564
    .local v3, "checkedinputstream":Ljava/util/zip/CheckedInputStream;
    const-wide/16 v6, 0x0

    .line 567
    .local v6, "crc":J
    :try_start_0
    new-instance v2, Ljava/io/BufferedInputStream;

    new-instance v9, Ljava/io/FileInputStream;

    invoke-direct {v9, p0}, Ljava/io/FileInputStream;-><init>(Ljava/io/File;)V

    invoke-direct {v2, v9}, Ljava/io/BufferedInputStream;-><init>(Ljava/io/InputStream;)V
    :try_end_0
    .catch Ljava/io/FileNotFoundException; {:try_start_0 .. :try_end_0} :catch_0
    .catch Ljava/io/IOException; {:try_start_0 .. :try_end_0} :catch_1

    .line 568
    .end local v1    # "bufbr":Ljava/io/BufferedInputStream;
    .local v2, "bufbr":Ljava/io/BufferedInputStream;
    :try_start_1
    new-instance v4, Ljava/util/zip/CheckedInputStream;

    invoke-direct {v4, v2, v5}, Ljava/util/zip/CheckedInputStream;-><init>(Ljava/io/InputStream;Ljava/util/zip/Checksum;)V
    :try_end_1
    .catch Ljava/io/FileNotFoundException; {:try_start_1 .. :try_end_1} :catch_4
    .catch Ljava/io/IOException; {:try_start_1 .. :try_end_1} :catch_2

    .line 569
    .end local v3    # "checkedinputstream":Ljava/util/zip/CheckedInputStream;
    .local v4, "checkedinputstream":Ljava/util/zip/CheckedInputStream;
    const/high16 v9, 0x10000

    :try_start_2
    new-array v0, v9, [B

    .line 570
    .local v0, "buf":[B
    :cond_0
    invoke-virtual {v4, v0}, Ljava/util/zip/CheckedInputStream;->read([B)I

    move-result v9

    if-gez v9, :cond_0

    .line 573
    invoke-virtual {v4}, Ljava/util/zip/CheckedInputStream;->getChecksum()Ljava/util/zip/Checksum;

    move-result-object v9

    invoke-interface {v9}, Ljava/util/zip/Checksum;->getValue()J

    move-result-wide v6

    .line 574
    invoke-virtual {v4}, Ljava/util/zip/CheckedInputStream;->close()V
    :try_end_2
    .catch Ljava/io/FileNotFoundException; {:try_start_2 .. :try_end_2} :catch_5
    .catch Ljava/io/IOException; {:try_start_2 .. :try_end_2} :catch_3

    move-object v3, v4

    .end local v4    # "checkedinputstream":Ljava/util/zip/CheckedInputStream;
    .restart local v3    # "checkedinputstream":Ljava/util/zip/CheckedInputStream;
    move-object v1, v2

    .line 595
    .end local v0    # "buf":[B
    .end local v2    # "bufbr":Ljava/io/BufferedInputStream;
    .restart local v1    # "bufbr":Ljava/io/BufferedInputStream;
    :goto_0
    return-wide v6

    .line 575
    :catch_0
    move-exception v8

    .line 576
    .local v8, "e":Ljava/io/FileNotFoundException;
    :goto_1
    invoke-virtual {v8}, Ljava/io/FileNotFoundException;->printStackTrace()V

    goto :goto_0

    .line 577
    .end local v8    # "e":Ljava/io/FileNotFoundException;
    :catch_1
    move-exception v8

    .line 578
    .local v8, "e":Ljava/io/IOException;
    :goto_2
    invoke-virtual {v8}, Ljava/io/IOException;->printStackTrace()V

    goto :goto_0

    .line 577
    .end local v1    # "bufbr":Ljava/io/BufferedInputStream;
    .end local v8    # "e":Ljava/io/IOException;
    .restart local v2    # "bufbr":Ljava/io/BufferedInputStream;
    :catch_2
    move-exception v8

    move-object v1, v2

    .end local v2    # "bufbr":Ljava/io/BufferedInputStream;
    .restart local v1    # "bufbr":Ljava/io/BufferedInputStream;
    goto :goto_2

    .end local v1    # "bufbr":Ljava/io/BufferedInputStream;
    .end local v3    # "checkedinputstream":Ljava/util/zip/CheckedInputStream;
    .restart local v2    # "bufbr":Ljava/io/BufferedInputStream;
    .restart local v4    # "checkedinputstream":Ljava/util/zip/CheckedInputStream;
    :catch_3
    move-exception v8

    move-object v3, v4

    .end local v4    # "checkedinputstream":Ljava/util/zip/CheckedInputStream;
    .restart local v3    # "checkedinputstream":Ljava/util/zip/CheckedInputStream;
    move-object v1, v2

    .end local v2    # "bufbr":Ljava/io/BufferedInputStream;
    .restart local v1    # "bufbr":Ljava/io/BufferedInputStream;
    goto :goto_2

    .line 575
    .end local v1    # "bufbr":Ljava/io/BufferedInputStream;
    .restart local v2    # "bufbr":Ljava/io/BufferedInputStream;
    :catch_4
    move-exception v8

    move-object v1, v2

    .end local v2    # "bufbr":Ljava/io/BufferedInputStream;
    .restart local v1    # "bufbr":Ljava/io/BufferedInputStream;
    goto :goto_1

    .end local v1    # "bufbr":Ljava/io/BufferedInputStream;
    .end local v3    # "checkedinputstream":Ljava/util/zip/CheckedInputStream;
    .restart local v2    # "bufbr":Ljava/io/BufferedInputStream;
    .restart local v4    # "checkedinputstream":Ljava/util/zip/CheckedInputStream;
    :catch_5
    move-exception v8

    move-object v3, v4

    .end local v4    # "checkedinputstream":Ljava/util/zip/CheckedInputStream;
    .restart local v3    # "checkedinputstream":Ljava/util/zip/CheckedInputStream;
    move-object v1, v2

    .end local v2    # "bufbr":Ljava/io/BufferedInputStream;
    .restart local v1    # "bufbr":Ljava/io/BufferedInputStream;
    goto :goto_1
.end method

.method private static getFileCRC32(Ljava/io/File;)J
    .locals 12
    .param p0, "file"    # Ljava/io/File;

    .prologue
    .line 703
    const-wide/16 v8, -0x1

    .line 704
    .local v8, "result":J
    invoke-virtual {p0}, Ljava/io/File;->length()J

    move-result-wide v10

    long-to-int v10, v10

    new-array v5, v10, [B

    .line 705
    .local v5, "filebuf":[B
    const/4 v3, 0x0

    .line 706
    .local v3, "filebr":Ljava/io/BufferedInputStream;
    new-instance v0, Ljava/util/zip/CRC32;

    invoke-direct {v0}, Ljava/util/zip/CRC32;-><init>()V

    .line 708
    .local v0, "crc32":Ljava/util/zip/CRC32;
    :try_start_0
    new-instance v4, Ljava/io/BufferedInputStream;

    new-instance v10, Ljava/io/FileInputStream;

    invoke-direct {v10, p0}, Ljava/io/FileInputStream;-><init>(Ljava/io/File;)V

    invoke-direct {v4, v10}, Ljava/io/BufferedInputStream;-><init>(Ljava/io/InputStream;)V
    :try_end_0
    .catch Ljava/io/FileNotFoundException; {:try_start_0 .. :try_end_0} :catch_0
    .catch Ljava/io/IOException; {:try_start_0 .. :try_end_0} :catch_2
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    .line 709
    .end local v3    # "filebr":Ljava/io/BufferedInputStream;
    .local v4, "filebr":Ljava/io/BufferedInputStream;
    const/4 v7, 0x0

    .line 711
    .local v7, "totallen":I
    :goto_0
    :try_start_1
    invoke-virtual {v4, v5}, Ljava/io/BufferedInputStream;->read([B)I

    move-result v6

    .line 712
    .local v6, "readlen":I
    if-gez v6, :cond_1

    .line 722
    invoke-virtual {v0}, Ljava/util/zip/CRC32;->getValue()J
    :try_end_1
    .catch Ljava/io/FileNotFoundException; {:try_start_1 .. :try_end_1} :catch_7
    .catch Ljava/io/IOException; {:try_start_1 .. :try_end_1} :catch_6
    .catchall {:try_start_1 .. :try_end_1} :catchall_1

    move-result-wide v8

    .line 730
    if-eqz v4, :cond_3

    .line 732
    :try_start_2
    invoke-virtual {v4}, Ljava/io/BufferedInputStream;->close()V
    :try_end_2
    .catch Ljava/io/IOException; {:try_start_2 .. :try_end_2} :catch_5

    move-object v3, v4

    .line 740
    .end local v4    # "filebr":Ljava/io/BufferedInputStream;
    .end local v6    # "readlen":I
    .end local v7    # "totallen":I
    .restart local v3    # "filebr":Ljava/io/BufferedInputStream;
    :cond_0
    :goto_1
    return-wide v8

    .line 715
    .end local v3    # "filebr":Ljava/io/BufferedInputStream;
    .restart local v4    # "filebr":Ljava/io/BufferedInputStream;
    .restart local v6    # "readlen":I
    .restart local v7    # "totallen":I
    :cond_1
    :try_start_3
    invoke-virtual {v0, v5}, Ljava/util/zip/CRC32;->update([B)V
    :try_end_3
    .catch Ljava/io/FileNotFoundException; {:try_start_3 .. :try_end_3} :catch_7
    .catch Ljava/io/IOException; {:try_start_3 .. :try_end_3} :catch_6
    .catchall {:try_start_3 .. :try_end_3} :catchall_1

    .line 716
    add-int/2addr v7, v6

    .line 710
    goto :goto_0

    .line 723
    .end local v4    # "filebr":Ljava/io/BufferedInputStream;
    .end local v6    # "readlen":I
    .end local v7    # "totallen":I
    .restart local v3    # "filebr":Ljava/io/BufferedInputStream;
    :catch_0
    move-exception v2

    .line 725
    .local v2, "e1":Ljava/io/FileNotFoundException;
    :goto_2
    :try_start_4
    invoke-virtual {v2}, Ljava/io/FileNotFoundException;->printStackTrace()V
    :try_end_4
    .catchall {:try_start_4 .. :try_end_4} :catchall_0

    .line 730
    if-eqz v3, :cond_0

    .line 732
    :try_start_5
    invoke-virtual {v3}, Ljava/io/BufferedInputStream;->close()V
    :try_end_5
    .catch Ljava/io/IOException; {:try_start_5 .. :try_end_5} :catch_1

    goto :goto_1

    .line 733
    :catch_1
    move-exception v1

    .line 735
    .local v1, "e":Ljava/io/IOException;
    invoke-virtual {v1}, Ljava/io/IOException;->printStackTrace()V

    goto :goto_1

    .line 726
    .end local v1    # "e":Ljava/io/IOException;
    .end local v2    # "e1":Ljava/io/FileNotFoundException;
    :catch_2
    move-exception v1

    .line 728
    .restart local v1    # "e":Ljava/io/IOException;
    :goto_3
    :try_start_6
    invoke-virtual {v1}, Ljava/io/IOException;->printStackTrace()V
    :try_end_6
    .catchall {:try_start_6 .. :try_end_6} :catchall_0

    .line 730
    if-eqz v3, :cond_0

    .line 732
    :try_start_7
    invoke-virtual {v3}, Ljava/io/BufferedInputStream;->close()V
    :try_end_7
    .catch Ljava/io/IOException; {:try_start_7 .. :try_end_7} :catch_3

    goto :goto_1

    .line 733
    :catch_3
    move-exception v1

    .line 735
    invoke-virtual {v1}, Ljava/io/IOException;->printStackTrace()V

    goto :goto_1

    .line 729
    .end local v1    # "e":Ljava/io/IOException;
    :catchall_0
    move-exception v10

    .line 730
    :goto_4
    if-eqz v3, :cond_2

    .line 732
    :try_start_8
    invoke-virtual {v3}, Ljava/io/BufferedInputStream;->close()V
    :try_end_8
    .catch Ljava/io/IOException; {:try_start_8 .. :try_end_8} :catch_4

    .line 738
    :cond_2
    :goto_5
    throw v10

    .line 733
    :catch_4
    move-exception v1

    .line 735
    .restart local v1    # "e":Ljava/io/IOException;
    invoke-virtual {v1}, Ljava/io/IOException;->printStackTrace()V

    goto :goto_5

    .line 733
    .end local v1    # "e":Ljava/io/IOException;
    .end local v3    # "filebr":Ljava/io/BufferedInputStream;
    .restart local v4    # "filebr":Ljava/io/BufferedInputStream;
    .restart local v6    # "readlen":I
    .restart local v7    # "totallen":I
    :catch_5
    move-exception v1

    .line 735
    .restart local v1    # "e":Ljava/io/IOException;
    invoke-virtual {v1}, Ljava/io/IOException;->printStackTrace()V

    .end local v1    # "e":Ljava/io/IOException;
    :cond_3
    move-object v3, v4

    .end local v4    # "filebr":Ljava/io/BufferedInputStream;
    .restart local v3    # "filebr":Ljava/io/BufferedInputStream;
    goto :goto_1

    .line 729
    .end local v3    # "filebr":Ljava/io/BufferedInputStream;
    .end local v6    # "readlen":I
    .restart local v4    # "filebr":Ljava/io/BufferedInputStream;
    :catchall_1
    move-exception v10

    move-object v3, v4

    .end local v4    # "filebr":Ljava/io/BufferedInputStream;
    .restart local v3    # "filebr":Ljava/io/BufferedInputStream;
    goto :goto_4

    .line 726
    .end local v3    # "filebr":Ljava/io/BufferedInputStream;
    .restart local v4    # "filebr":Ljava/io/BufferedInputStream;
    :catch_6
    move-exception v1

    move-object v3, v4

    .end local v4    # "filebr":Ljava/io/BufferedInputStream;
    .restart local v3    # "filebr":Ljava/io/BufferedInputStream;
    goto :goto_3

    .line 723
    .end local v3    # "filebr":Ljava/io/BufferedInputStream;
    .restart local v4    # "filebr":Ljava/io/BufferedInputStream;
    :catch_7
    move-exception v2

    move-object v3, v4

    .end local v4    # "filebr":Ljava/io/BufferedInputStream;
    .restart local v3    # "filebr":Ljava/io/BufferedInputStream;
    goto :goto_2
.end method

.method private static isFileValid(Ljava/lang/String;J)Z
    .locals 5
    .param p0, "path"    # Ljava/lang/String;
    .param p1, "length"    # J

    .prologue
    .line 499
    new-instance v0, Ljava/io/File;

    invoke-direct {v0, p0}, Ljava/io/File;-><init>(Ljava/lang/String;)V

    .line 500
    .local v0, "tmpfile":Ljava/io/File;
    invoke-virtual {v0}, Ljava/io/File;->exists()Z

    move-result v1

    if-eqz v1, :cond_0

    .line 501
    invoke-virtual {v0}, Ljava/io/File;->length()J

    move-result-wide v2

    cmp-long v1, v2, p1

    if-nez v1, :cond_0

    .line 502
    const/4 v1, 0x1

    .line 505
    :goto_0
    return v1

    :cond_0
    const/4 v1, 0x0

    goto :goto_0
.end method
