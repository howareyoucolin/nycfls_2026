<?php
declare(strict_types=1);

require_once ROOT_PATH . 'api/_vip_admin_auth.php';

vip_admin_enforce_canonical_origin();

header('Location: /vip/admin/vips/', true, 302);
exit;
