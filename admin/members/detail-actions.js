(() => {
  if (!window.MomoAdmin) return;
  MomoAdmin.requireAdmin();
  const id = new URLSearchParams(location.search).get('id') || new URLSearchParams(location.hash.replace(/^#/, '')).get('id');
  const raw = MomoAdmin.read('momoUsers', []);
  const users = Array.isArray(raw) ? raw : Array.isArray(raw?.users) ? raw.users : [];
  const member = users.find((user) => user.role !== 'ADMIN' && (String(user.id) === String(id) || String(user.email) === String(id)));
  const hero = document.querySelector('.member-hero');
  if (!member || !hero) return;
  const actions = document.createElement('div');
  actions.className = 'member-hero-actions';
  actions.innerHTML = '<button class="member-delete-button" type="button">회원 삭제</button>';
  hero.append(actions);
  actions.querySelector('button').addEventListener('click', async () => {
    if (!await MomoAdmin.confirm(`“${member.name || member.email}” 회원을 정말 삭제하시겠습니까?\n주문과 문의 이력은 운영 기록으로 유지됩니다.`, '회원 삭제')) return;
    MomoAdmin.requireAdmin();
    const remaining = users.filter((user) => String(user.id ?? user.email) !== String(member.id ?? member.email));
    localStorage.setItem('momoUsers', JSON.stringify(Array.isArray(raw) ? remaining : { ...raw, users:remaining }));
    const lastRegistered = MomoAdmin.read('momoLastRegisteredUser', null);
    if (lastRegistered && String(lastRegistered.id ?? lastRegistered.email) === String(member.id ?? member.email)) localStorage.removeItem('momoLastRegisteredUser');
    MomoAdminActivity?.log(MomoAdmin.user, 'DELETE_MEMBER', 'MEMBER', member.id ?? member.email, '회원 계정 삭제', { id:member.id, email:member.email, name:member.name }, null);
    MomoAdmin.toast('회원 계정이 삭제되었습니다.');
    window.setTimeout(() => location.replace('/admin/members/list.html'), 250);
  });
})();
