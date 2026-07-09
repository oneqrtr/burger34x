export function scrollToMenuProducts(behavior: ScrollBehavior = 'smooth'): void {
  requestAnimationFrame(() => {
    document.getElementById('menu-urunler')?.scrollIntoView({ behavior, block: 'start' });
  });
}
