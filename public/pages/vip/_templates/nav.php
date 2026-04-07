<?php
declare(strict_types=1);

$currentVipPath = parse_url($_SERVER['REQUEST_URI'] ?? '/vip', PHP_URL_PATH) ?: '/vip';
$isEditPath = str_starts_with($currentVipPath, '/vip/edit');
$signupNavHref = $isEditPath ? '/vip/edit' : '/vip/signup';
$signupNavLabel = $isEditPath ? '编辑我的资料' : '报名成为群成员';
?>
<nav class="vip-nav" aria-label="VIP 导航" data-vip-nav>
  <a class="vip-nav-link <?php echo $currentVipPath === '/vip' || $currentVipPath === '/vip/' ? 'is-active' : ''; ?>" href="/vip">
    查看群成员
  </a>
  <a class="vip-nav-link <?php echo str_starts_with($currentVipPath, '/vip/signup') || str_starts_with($currentVipPath, '/vip/edit') ? 'is-active' : ''; ?>" href="<?php echo htmlspecialchars($signupNavHref, ENT_QUOTES, 'UTF-8'); ?>" data-vip-signup-link>
    <?php echo htmlspecialchars($signupNavLabel, ENT_QUOTES, 'UTF-8'); ?>
  </a>
</nav>
<script src="/pages/vip/_templates/nav.js?v=2" defer></script>
