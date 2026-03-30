<?php
declare(strict_types=1);

$currentVipPath = parse_url($_SERVER['REQUEST_URI'] ?? '/vip', PHP_URL_PATH) ?: '/vip';
?>
<nav class="vip-nav" aria-label="VIP 导航" data-vip-nav>
  <a class="vip-nav-link <?php echo $currentVipPath === '/vip' || $currentVipPath === '/vip/' ? 'is-active' : ''; ?>" href="/vip">
    查看群成员
  </a>
  <a class="vip-nav-link <?php echo str_starts_with($currentVipPath, '/vip/signup') ? 'is-active' : ''; ?>" href="/vip/signup">
    报名成为群成员
  </a>
</nav>
