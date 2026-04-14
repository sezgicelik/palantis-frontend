/* servers.js — Noxara sunucu config */
const SUNUCULAR = [
  { id:'tr1', isim:'Anadolu', url:'https://palantis-backend-production.up.railway.app', durum:'aktif', aciklama:'Ana sunucu', ikon:'🏔️' },
  { id:'tr2', isim:'Trakya',  url:'', durum:'yakinda', aciklama:'Yakinda acilacak', ikon:'🌊' },
];

function getSelectedServer() {
  const id = localStorage.getItem('noxara_server');
  return SUNUCULAR.find(s => s.id === id) || null;
}
function setSelectedServer(id) {
  localStorage.setItem('noxara_server', id);
}
function getApiBase() {
  const srv = getSelectedServer();
  return srv?.url || SUNUCULAR.find(s => s.durum === 'aktif')?.url || '';
}
