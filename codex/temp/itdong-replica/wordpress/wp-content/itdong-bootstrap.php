<?php
/**
 * First-run WordPress initializer for the ITDong replica.
 * Run with: wp eval-file /var/www/html/wp-content/itdong-bootstrap.php
 */

if (!defined('ABSPATH')) {
    exit;
}

const ITDONG_SEED_VERSION = '1.0.0';

if (get_option('itdong_replica_seed_version') === ITDONG_SEED_VERSION) {
    WP_CLI::success('站点初始化数据已存在，未覆盖后台中的现有修改。');
    return;
}

function itdong_upsert_page($slug, $title, $content, $template = 'default', $comments = 'closed') {
    $page = get_page_by_path($slug, OBJECT, 'page');
    $data = array(
        'post_type' => 'page',
        'post_status' => 'publish',
        'post_name' => $slug,
        'post_title' => $title,
        'post_content' => $content,
        'comment_status' => $comments,
    );

    if ($page) {
        $data['ID'] = $page->ID;
        $page_id = wp_update_post(wp_slash($data), true);
    } else {
        $page_id = wp_insert_post(wp_slash($data), true);
    }

    if (is_wp_error($page_id)) {
        throw new RuntimeException($page_id->get_error_message());
    }

    update_post_meta($page_id, '_wp_page_template', $template);
    return (int) $page_id;
}

function itdong_ensure_term($name, $taxonomy, $slug = '') {
    $exists = term_exists($slug ?: $name, $taxonomy);
    if ($exists) {
        return (int) (is_array($exists) ? $exists['term_id'] : $exists);
    }

    $created = wp_insert_term($name, $taxonomy, $slug ? array('slug' => $slug) : array());
    if (is_wp_error($created)) {
        throw new RuntimeException($created->get_error_message());
    }
    return (int) $created['term_id'];
}

function itdong_upsert_post($item, $category_ids) {
    $post = get_page_by_path($item['slug'], OBJECT, 'post');
    $timestamp = current_time('timestamp') - ((int) $item['days_ago'] * DAY_IN_SECONDS);
    $data = array(
        'post_type' => 'post',
        'post_status' => 'publish',
        'post_name' => $item['slug'],
        'post_title' => $item['title'],
        'post_excerpt' => $item['excerpt'],
        'post_content' => $item['content'],
        'post_date' => wp_date('Y-m-d H:i:s', $timestamp),
        'post_date_gmt' => get_gmt_from_date(wp_date('Y-m-d H:i:s', $timestamp)),
        'post_category' => $category_ids,
        'tags_input' => $item['tags'],
        'comment_status' => 'open',
    );

    if ($post) {
        $data['ID'] = $post->ID;
        $post_id = wp_update_post(wp_slash($data), true);
    } else {
        $post_id = wp_insert_post(wp_slash($data), true);
    }

    if (is_wp_error($post_id)) {
        throw new RuntimeException($post_id->get_error_message());
    }
    return (int) $post_id;
}

function itdong_menu_has_object($menu_id, $object_id) {
    foreach ((array) wp_get_nav_menu_items($menu_id) as $item) {
        if ((int) $item->object_id === (int) $object_id) {
            return true;
        }
    }
    return false;
}

function itdong_menu_has_url($menu_id, $url) {
    foreach ((array) wp_get_nav_menu_items($menu_id) as $item) {
        if (untrailingslashit($item->url) === untrailingslashit($url)) {
            return true;
        }
    }
    return false;
}

function itdong_get_or_create_menu($name) {
    $menu = wp_get_nav_menu_object($name);
    if ($menu) {
        return (int) $menu->term_id;
    }
    $menu_id = wp_create_nav_menu($name);
    if (is_wp_error($menu_id)) {
        throw new RuntimeException($menu_id->get_error_message());
    }
    return (int) $menu_id;
}

$site_title = trim((string) get_option('blogname'));
if ($site_title === '' || $site_title === 'WordPress') {
    $site_title = '我的个人站点';
}

update_option('blogname', $site_title);
update_option('blogdescription', '一个记录和分享的地方');
update_option('timezone_string', 'Asia/Shanghai');
update_option('date_format', 'Y-m-d');
update_option('time_format', 'H:i');
update_option('start_of_week', 1);
update_option('posts_per_page', 10);
update_option('show_on_front', 'posts');
update_option('default_comment_status', 'open');
update_option('default_ping_status', 'closed');
update_option('permalink_structure', '/%postname%/');

$logo_url = get_stylesheet_directory_uri() . '/assets/logo.png';
$theme_options = array(
    'argon_toolbar_icon' => $logo_url,
    'argon_toolbar_icon_link' => home_url('/'),
    'argon_toolbar_title' => $site_title,
    'argon_sidebar_banner_title' => $site_title,
    'argon_sidebar_banner_subtitle' => '欢迎来到我的个人博客',
    'argon_sidebar_auther_name' => '站点作者',
    'argon_sidebar_auther_image' => $logo_url,
    'argon_sidebar_author_description' => '记录技术、生活与灵感，持续分享学习与实践。',
    'argon_banner_title' => $site_title,
    'argon_banner_subtitle' => '记录与分享，让每一次成长都有迹可循',
    'argon_banner_background_url' => '',
    'argon_banner_background_color_type' => 'shape-primary',
    'argon_banner_background_hide_shapes' => 'true',
    'argon_banner_size' => 'full',
    'argon_page_background_url' => 'https://api.foreverlink.love/bing',
    'argon_page_background_dark_url' => 'https://api.foreverlink.love/bing',
    'argon_page_background_opacity' => '0.74',
    'argon_page_background_banner_style' => 'transparent',
    'argon_show_toolbar_mask' => 'true',
    'argon_theme_color' => '#2196f3',
    'argon_show_customize_theme_color_picker' => 'true',
    'argon_card_radius' => '25',
    'argon_card_shadow' => 'big',
    'argon_page_layout' => 'triple',
    'argon_article_list_layout' => '1',
    'argon_article_list_waterflow' => '1',
    'argon_article_header_style' => 'article-header-style-1',
    'argon_font' => 'serif',
    'argon_toolbar_blur' => 'true',
    'argon_enable_immersion_color' => 'true',
    'argon_darkmode_autoswitch' => 'system',
    'argon_enable_amoled_dark' => 'false',
    'argon_enable_headroom' => 'true',
    'argon_enable_banner_title_typing_effect' => 'true',
    'argon_banner_typing_effect_interval' => '150',
    'argon_enable_smoothscroll_type' => '1',
    'argon_pjax_disabled' => 'false',
    'argon_disable_pjax_animation' => 'false',
    'argon_enable_into_article_animation' => 'true',
    'argon_enable_lazyload' => 'true',
    'argon_lazyload_effect' => 'fadeIn',
    'argon_lazyload_threshold' => '800',
    'argon_lazyload_loading_style' => '1',
    'argon_enable_code_highlight' => 'true',
    'argon_code_highlight_hide_linenumber' => 'false',
    'argon_code_highlight_transparent_linenumber' => 'false',
    'argon_code_highlight_break_line' => 'false',
    'argon_code_theme' => 'vs',
    'argon_article_meta' => 'time|views|comments|categories',
    'argon_show_readingtime' => 'true',
    'argon_reading_speed' => '300',
    'argon_reading_speed_en' => '200',
    'argon_reading_speed_code' => '20',
    'argon_show_sharebtn' => 'true',
    'argon_trim_words_count' => '120',
    'argon_fold_long_comments' => 'true',
    'argon_comment_allow_markdown' => 'true',
    'argon_comment_allow_editing' => 'true',
    'argon_comment_allow_privatemode' => 'true',
    'argon_enable_comment_upvote' => 'true',
    'argon_fab_show_darkmode_button' => 'true',
    'argon_fab_show_settings_button' => 'true',
    'argon_fab_show_gotocomment_button' => 'true',
    'argon_enable_mobile_scale' => 'true',
    'argon_disable_googlefont' => 'false',
    'argon_assets_path' => 'default',
    'argon_update_source' => 'stop',
    'argon_enable_login_css' => 'true',
    'argon_sidebar_announcement' => '<strong>欢迎访问</strong><br>这里记录技术、生活与成长，欢迎留言交流。',
    'argon_footer_html' => 'Copyright &copy; ' . wp_date('Y') . ' ' . esc_html($site_title) . ' · 内容由 WordPress 后台管理',
    'argon_seo_description' => '一个记录技术、生活与成长的个人站点。',
    'argon_seo_keywords' => '个人博客,WordPress,Argon,技术分享',
);

foreach ($theme_options as $name => $value) {
    update_option($name, $value);
}

$history_content = <<<'HTML'
<div class="itdong-lead"><strong>这里记录网站的重要节点。</strong><br>你可以在后台编辑本页面，继续添加自己的成长、项目和站点历程。</div>
<div class="itdong-timeline">
  <div class="itdong-timeline-item"><time>第一阶段</time><h3>建立个人站点</h3><p>完成 WordPress、Argon 主题、导航菜单和基础页面配置。</p></div>
  <div class="itdong-timeline-item"><time>第二阶段</time><h3>开始持续发布</h3><p>通过后台发布文章，使用分类和标签组织内容。</p></div>
  <div class="itdong-timeline-item"><time>未来</time><h3>继续记录与分享</h3><p>持续完善内容、互动、备份和站点性能。</p></div>
</div>
HTML;

$thoughts_content = <<<'HTML'
<div class="itdong-lead">这是一个可以写下站点说明、个人介绍、免责声明或长期置顶文字的页面。</div>
<h2>关于本站</h2>
<p>本站用于记录学习笔记、项目实践和生活片段。文章内容由站点作者在 WordPress 后台维护。</p>
<h2>转载与引用</h2>
<p>如需转载原创文章，请保留来源并联系作者确认授权。</p>
<h2>隐私说明</h2>
<p>访客提交评论时，WordPress 可能保存昵称、邮箱、IP 地址和浏览器信息，用于评论展示与反垃圾处理。</p>
HTML;

$links_content = <<<'HTML'
<div class="itdong-lead">欢迎交换友情链接。你可以直接在后台编辑本页面中的名称、简介和网址。</div>
<div class="itdong-card-grid">
  <div class="itdong-info-card"><h3>示例友链 A</h3><p>在这里填写朋友站点的简介。</p><p><a href="#">访问站点 →</a></p></div>
  <div class="itdong-info-card"><h3>示例友链 B</h3><p>建议保持简介简短，并定期检查链接是否有效。</p><p><a href="#">访问站点 →</a></p></div>
</div>
HTML;

$status_content = <<<'HTML'
<div class="itdong-lead">这里是站点状态展示页。下方状态为初始化示例，不代表真实外部监控结果。</div>
<div class="itdong-card-grid">
  <div class="itdong-info-card"><h3>WordPress 前台</h3><p class="itdong-status">运行中</p><p>文章、分类、标签和页面访问。</p></div>
  <div class="itdong-info-card"><h3>后台管理</h3><p class="itdong-status">运行中</p><p>内容发布、评论审核与外观配置。</p></div>
  <div class="itdong-info-card"><h3>数据库</h3><p class="itdong-status">运行中</p><p>由 MariaDB 持久化保存站点数据。</p></div>
  <div class="itdong-info-card"><h3>备份</h3><p>部署后请配置数据库和 wp-content 的定期备份。</p></div>
</div>
HTML;

$books_content = <<<'HTML'
<div class="itdong-lead">用这个页面记录正在阅读、计划阅读和已经读完的书籍。</div>
<div class="itdong-card-grid">
  <div class="itdong-info-card"><h3>正在阅读</h3><p>在后台编辑这里，填写书名与阅读进度。</p></div>
  <div class="itdong-info-card"><h3>阅读计划</h3><p>记录下一本准备阅读的书。</p></div>
  <div class="itdong-info-card"><h3>阅读笔记</h3><p>也可以为每本书单独发布文章，并添加“读书”分类。</p></div>
</div>
HTML;

$page_ids = array();
$page_ids['history'] = itdong_upsert_page('historical-timeline', '历史时间轴', $history_content);
$page_ids['archive'] = itdong_upsert_page('archive-timeline', '归档时间轴', '<p>这里会按照月份展示已经发布的文章。</p>', 'timeline.php');
$page_ids['message'] = itdong_upsert_page('message-area', '留言', '<div class="itdong-lead">欢迎留言交流。首次评论可能需要管理员在后台审核。</div>', 'msgboard.php', 'open');
$page_ids['thoughts'] = itdong_upsert_page('privacy-policy', '某些话', $thoughts_content);
$page_ids['links'] = itdong_upsert_page('links', '友情链接', $links_content);
$page_ids['status'] = itdong_upsert_page('site-status', '站点状态', $status_content);
$page_ids['books'] = itdong_upsert_page('book', '书籍', $books_content);
update_option('wp_page_for_privacy_policy', $page_ids['thoughts']);

$category_ids = array(
    '公告' => itdong_ensure_term('公告', 'category', 'announcement'),
    'WordPress' => itdong_ensure_term('WordPress', 'category', 'wordpress'),
    '开发笔记' => itdong_ensure_term('开发笔记', 'category', 'dev-notes'),
    '生活随笔' => itdong_ensure_term('生活随笔', 'category', 'life'),
);

$seed_posts = array(
    array(
        'title' => '欢迎来到我的站点',
        'slug' => 'welcome-to-my-site',
        'excerpt' => '站点已经完成基础配置。登录 WordPress 后台即可发布文章、管理页面、分类、标签、菜单和评论。',
        'content' => '<p>欢迎来到我的个人站点。</p><p>当前站点使用 WordPress 与 Argon 主题搭建，已经配置桌面端三栏布局、移动端单栏布局、归档时间轴和留言板。</p><h2>下一步</h2><ol><li>进入后台修改站点标题和个人资料。</li><li>删除或改写初始化示例文章。</li><li>发布你的第一篇正式内容。</li></ol>',
        'categories' => array('公告'),
        'tags' => array('Argon', 'WordPress'),
        'days_ago' => 0,
    ),
    array(
        'title' => '从 WordPress 后台发布第一篇文章',
        'slug' => 'publish-first-wordpress-post',
        'excerpt' => '进入“文章 → 写文章”，填写标题和正文，选择分类与标签后点击发布。',
        'content' => '<p>在后台左侧菜单进入“文章 → 写文章”。建议每篇文章至少设置一个分类，并补充少量准确的标签。</p><p>文章发布后会自动出现在首页，Argon 会生成摘要、阅读时间、分类和评论入口。</p>',
        'categories' => array('WordPress'),
        'tags' => array('WordPress', '教程'),
        'days_ago' => 2,
    ),
    array(
        'title' => '如何管理分类与标签',
        'slug' => 'manage-categories-and-tags',
        'excerpt' => '分类用于建立稳定的内容结构，标签用于描述文章涉及的具体主题。',
        'content' => '<p>分类适合少而稳定，标签可以更具体。避免创建大量只有一篇文章的重复分类。</p><p>首页右侧栏会自动展示分类和标签云，无需手工更新。</p>',
        'categories' => array('WordPress', '开发笔记'),
        'tags' => array('内容管理', 'WordPress'),
        'days_ago' => 5,
    ),
    array(
        'title' => '使用菜单组织网站导航',
        'slug' => 'organize-site-navigation',
        'excerpt' => '通过“外观 → 菜单”调整顶部导航、作者链接和侧栏菜单。',
        'content' => '<p>顶部导航已经初始化常用页面。你可以拖动菜单项调整顺序，也可以添加分类、自定义链接或新页面。</p>',
        'categories' => array('WordPress'),
        'tags' => array('菜单', '教程'),
        'days_ago' => 8,
    ),
    array(
        'title' => 'Argon 主题外观设置说明',
        'slug' => 'argon-theme-settings',
        'excerpt' => '主题色、背景、Banner、圆角、阴影、布局和评论功能都可以在后台调整。',
        'content' => '<p>进入“Argon 主题选项”即可修改主题色、Banner、副标题、背景图、三栏布局、卡片圆角和夜间模式。</p><p>建议每次只修改少量选项并查看前台效果。</p>',
        'categories' => array('开发笔记'),
        'tags' => array('Argon', '主题'),
        'days_ago' => 12,
    ),
    array(
        'title' => '评论与留言板使用指南',
        'slug' => 'comments-and-message-board',
        'excerpt' => '留言板和文章评论共用 WordPress 评论系统，可以在后台统一审核。',
        'content' => '<p>访客留言会出现在“评论”菜单。你可以批准、回复、标记垃圾评论或移入回收站。</p><p>正式上线前建议配置反垃圾评论插件和邮件发送服务。</p>',
        'categories' => array('WordPress'),
        'tags' => array('评论', '留言板'),
        'days_ago' => 16,
    ),
    array(
        'title' => '文章图片与媒体库管理',
        'slug' => 'media-library-guide',
        'excerpt' => '上传图片时使用清晰文件名和合理尺寸，可以减少页面加载时间。',
        'content' => '<p>图片统一通过媒体库上传。封面图建议使用横向图片，并在发布前压缩体积。</p><p>不要直接上传超大原图；生产环境建议启用 WebP 转换与缓存。</p>',
        'categories' => array('开发笔记'),
        'tags' => array('图片', '性能'),
        'days_ago' => 21,
    ),
    array(
        'title' => '站点维护与备份建议',
        'slug' => 'site-maintenance-and-backup',
        'excerpt' => '定期备份数据库和 wp-content，并在更新 WordPress、主题或插件前创建恢复点。',
        'content' => '<p>完整备份至少包含数据库与 wp-content 目录。部署项目提供 Docker 数据卷，生产环境仍需要额外的异地备份。</p>',
        'categories' => array('开发笔记'),
        'tags' => array('备份', '运维'),
        'days_ago' => 28,
    ),
);

$first_post_id = 0;
foreach ($seed_posts as $index => $item) {
    $ids = array_map(function ($name) use ($category_ids) {
        return $category_ids[$name];
    }, $item['categories']);
    $post_id = itdong_upsert_post($item, $ids);
    if ($index === 0) {
        $first_post_id = $post_id;
    }
}
if ($first_post_id) {
    stick_post($first_post_id);
}

$top_menu_id = itdong_get_or_create_menu('顶部导航');
foreach (array('history', 'archive', 'message', 'thoughts', 'links', 'status', 'books') as $key) {
    if (!itdong_menu_has_object($top_menu_id, $page_ids[$key])) {
        wp_update_nav_menu_item($top_menu_id, 0, array(
            'menu-item-object-id' => $page_ids[$key],
            'menu-item-object' => 'page',
            'menu-item-type' => 'post_type',
            'menu-item-status' => 'publish',
        ));
    }
}

$author_menu_id = itdong_get_or_create_menu('作者链接');
$author_links = array(
    'RSS' => get_feed_link(),
    '站点地图' => home_url('/wp-sitemap.xml'),
    '邮件' => 'mailto:' . get_option('admin_email'),
);
foreach ($author_links as $label => $url) {
    if (!itdong_menu_has_url($author_menu_id, $url)) {
        wp_update_nav_menu_item($author_menu_id, 0, array(
            'menu-item-title' => $label,
            'menu-item-url' => $url,
            'menu-item-status' => 'publish',
        ));
    }
}

$left_menu_id = itdong_get_or_create_menu('侧栏菜单');
foreach (array('archive', 'message', 'links', 'books') as $key) {
    if (!itdong_menu_has_object($left_menu_id, $page_ids[$key])) {
        wp_update_nav_menu_item($left_menu_id, 0, array(
            'menu-item-object-id' => $page_ids[$key],
            'menu-item-object' => 'page',
            'menu-item-type' => 'post_type',
            'menu-item-status' => 'publish',
        ));
    }
}

$locations = get_theme_mod('nav_menu_locations', array());
$locations['toolbar_menu'] = $top_menu_id;
$locations['leftbar_menu'] = $left_menu_id;
$locations['leftbar_author_links'] = $author_menu_id;
set_theme_mod('nav_menu_locations', $locations);

update_option('widget_recent-comments', array(
    2 => array('title' => '最新评论', 'number' => 5, 'show_date' => 0),
    '_multiwidget' => 1,
));
update_option('widget_custom_html', array(
    2 => array(
        'title' => '站点信息',
        'content' => '<p><strong>' . esc_html($site_title) . '</strong></p><p>由 WordPress + Argon 驱动。</p><p><a href="' . esc_url(admin_url()) . '">进入后台管理</a></p>',
    ),
    '_multiwidget' => 1,
));
update_option('widget_tag_cloud', array(
    2 => array('title' => '标签云', 'count' => 1, 'taxonomy' => 'post_tag'),
    '_multiwidget' => 1,
));
update_option('widget_categories', array(
    2 => array('title' => '深入探索', 'count' => 0, 'hierarchical' => 1, 'dropdown' => 0),
    '_multiwidget' => 1,
));

$sidebars = get_option('sidebars_widgets', array());
$sidebars['rightbar-tools'] = array('recent-comments-2', 'custom_html-2', 'tag_cloud-2', 'categories-2');
$sidebars['leftbar-tools'] = isset($sidebars['leftbar-tools']) ? $sidebars['leftbar-tools'] : array();
$sidebars['leftbar-siteinfo-extra-tools'] = isset($sidebars['leftbar-siteinfo-extra-tools']) ? $sidebars['leftbar-siteinfo-extra-tools'] : array();
update_option('sidebars_widgets', $sidebars);

if (!get_option('site_icon')) {
    $source = get_stylesheet_directory() . '/assets/logo.png';
    if (is_readable($source)) {
        $upload = wp_upload_bits('site-logo.png', null, file_get_contents($source));
        if (empty($upload['error'])) {
            $attachment_id = wp_insert_attachment(array(
                'post_mime_type' => 'image/png',
                'post_title' => $site_title . ' 站点图标',
                'post_status' => 'inherit',
            ), $upload['file']);
            if ($attachment_id && !is_wp_error($attachment_id)) {
                require_once ABSPATH . 'wp-admin/includes/image.php';
                wp_update_attachment_metadata($attachment_id, wp_generate_attachment_metadata($attachment_id, $upload['file']));
                update_option('site_icon', $attachment_id);
            }
        }
    }
}

flush_rewrite_rules();
update_option('itdong_replica_seed_version', ITDONG_SEED_VERSION);
WP_CLI::success('WordPress、Argon 外观、页面、菜单、小工具和示例内容初始化完成。');
