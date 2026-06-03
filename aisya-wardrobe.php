<?php
/**
 * Plugin Name: Aisya Wardrobe App
 * Description: Jembatan khusus untuk aplikasi React Vite Aisya Wardrobe dengan Image Server
 * Version: 2.1
 */

if (!defined('ABSPATH')) exit; // Keamanan

add_action('rest_api_init', function () {
    // 1. Endpoint: GET Database
    register_rest_route('aisya/v1', '/db', array(
        'methods' => 'GET',
        'callback' => function() {
            $data = get_option('aisya_db_storage', null);
            if (!$data) return rest_ensure_response(['status' => 'empty']);
            return rest_ensure_response(json_decode($data, true));
        },
        'permission_callback' => '__return_true'
    ));

    // 2. Endpoint: POST Database (Menyimpan Teks Saja)
    register_rest_route('aisya/v1', '/db', array(
        'methods' => 'POST',
        'callback' => function(WP_REST_Request $request) {
            $data = $request->get_json_params();
            update_option('aisya_db_storage', wp_json_encode($data));
            return rest_ensure_response(['success' => true]);
        },
        'permission_callback' => '__return_true' 
    ));

    // 3. Endpoint BARU: Server Upload Gambar Otomatis
    register_rest_route('aisya/v1', '/upload', array(
        'methods' => 'POST',
        'callback' => function(WP_REST_Request $request) {
            $data = $request->get_json_params();
            if (empty($data['image'])) return new WP_Error('no_data', 'Gambar gagal dikirim.', ['status' => 400]);
            
            // Menerima file gambar dan mengubahnya jadi JPG fisik
            $base64 = $data['image'];
            if (strpos($base64, ',') !== false) {
                $parts = explode(',', $base64);
                $base64 = $parts[1];
            }
            
            $image_data = base64_decode($base64);
            $upload_dir = wp_upload_dir(); // Folder bawaan DomaiNesia/WordPress
            $filename = 'aw_img_' . time() . '_' . rand(1000, 9999) . '.jpg';
            $file_path = $upload_dir['path'] . '/' . $filename;
            
            // Simpan gambar ke SSD Server DomaiNesia
            file_put_contents($file_path, $image_data);
            $file_url = $upload_dir['url'] . '/' . $filename;
            
            // Kembalikan URL gambar ke aplikasi React
            return rest_ensure_response(['success' => true, 'url' => $file_url]);
        },
        'permission_callback' => '__return_true'
    ));
});

// Fungsi pembungkus Shortcode
function aisya_wardrobe_shortcode() {
    $js_url = plugin_dir_url(__FILE__) . 'dist/assets/index.js?v=' . time();
    $css_url = plugin_dir_url(__FILE__) . 'dist/assets/index.css?v=' . time();

    add_action('wp_footer', function() use ($js_url, $css_url) {
        echo '<link rel="stylesheet" href="' . esc_url($css_url) . '">';
        echo '<script type="module" crossorigin src="' . esc_url($js_url) . '"></script>';
    });
    
    ob_start();
    ?>
    <div id="aisya-react-root"></div>

    <!-- KONFIGURASI API -->
    <script>
        window.aisyaConfig = {
            apiUrl: '<?php echo esc_url(rest_url('aisya/v1/db')); ?>',
            uploadUrl: '<?php echo esc_url(rest_url('aisya/v1/upload')); ?>',
            nonce: '<?php echo wp_create_nonce('wp_rest'); ?>'
        };
    </script>

    <style>
        #aisya-react-root { position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; z-index: 999999 !important; background-color: #f3f4f6 !important; overflow-y: auto !important; }
        body > *:not(#aisya-react-root) { display: none !important; }
        html, body { margin: 0 !important; padding: 0 !important; overflow: hidden !important; }
    </style>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            var appRoot = document.getElementById('aisya-react-root');
            if(appRoot) document.body.appendChild(appRoot);
        });
    </script>
    <?php
    return ob_get_clean();
}
add_shortcode('aisya_app', 'aisya_wardrobe_shortcode');