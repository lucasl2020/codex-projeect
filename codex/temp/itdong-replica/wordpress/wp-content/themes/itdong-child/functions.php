<?php
/**
 * ITDong Replica child-theme helpers.
 */

if (!defined('ABSPATH')) {
    exit;
}

add_action('wp_enqueue_scripts', function () {
    wp_enqueue_style(
        'itdong-replica-style',
        get_stylesheet_uri(),
        array('style'),
        '1.0.0'
    );
}, 100);

add_action('login_enqueue_scripts', function () {
    $logo = esc_url(get_stylesheet_directory_uri() . '/assets/logo.png');
    echo '<style>
        body.login { background: #e0f0fd; }
        #login h1 a {
            width: 96px;
            height: 96px;
            border-radius: 50%;
            background-image: url(' . $logo . ');
            background-size: contain;
        }
        .login form { border: 0; border-radius: 20px; box-shadow: 0 15px 35px rgba(50,50,93,.12); }
        .wp-core-ui .button-primary { border-color: #2196f3; background: #2196f3; }
    </style>';
});

add_action('wp_dashboard_setup', function () {
    wp_add_dashboard_widget(
        'itdong_replica_quick_links',
        '站点管理快捷入口',
        function () {
            $links = array(
                '发布文章' => admin_url('post-new.php'),
                '管理页面' => admin_url('edit.php?post_type=page'),
                '管理菜单' => admin_url('nav-menus.php'),
                '管理小工具' => admin_url('widgets.php'),
                'Argon 主题选项' => admin_url('admin.php?page=functions.php'),
            );
            echo '<p>这里是本站最常用的后台入口：</p><ul>';
            foreach ($links as $label => $url) {
                printf('<li><a href="%s">%s</a></li>', esc_url($url), esc_html($label));
            }
            echo '</ul>';
        }
    );
});
