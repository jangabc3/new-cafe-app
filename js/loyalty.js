(() => {
  if (window.MomoLoyalty) return;
  const BENEFITS_KEY = 'momo_member_benefits_v1';
  const MEMBERSHIP_KEY = 'momo_memberships_v1';
  const CURRENT_USER_KEY = 'momoCurrentUser';
  const USERS_KEY = 'momoUsers';
  const REVIEWS_KEY = 'momo_event_reviews_v1';
  const COUPONS_KEY = 'momo_coffee_coupons_v1';
  const GRADE_REWARDS_KEY = 'momo_monthly_grade_rewards_v1';

  const read = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const getUser = () => read(CURRENT_USER_KEY, null);
  const getUserKey = (user = getUser()) => String(user?.id || user?.email || '').toLowerCase();

  const getBenefit = () => {
    const user = getUser();
    if (!user) return null;
    const key = getUserKey(user);
    const all = read(BENEFITS_KEY, {});
    const stored = all[key] || {};
    const membership = read(MEMBERSHIP_KEY, {})[key] || {
      status: 'active',
      autoEnrolled: true,
      enrolledAt: user.createdAt || new Date().toISOString()
    };
    return {
      points: Math.max(0, Number(stored.points ?? user.points ?? 0)),
      stamps: Math.max(0, Number(stored.stamps || 0)),
      rewards: Math.max(0, Number(stored.rewards || 0)),
      stampedOrders: Array.isArray(stored.stampedOrders) ? stored.stampedOrders : [],
      membership
    };
  };

  const saveBenefit = (benefit) => {
    const user = getUser();
    if (!user) return null;
    const key = getUserKey(user);
    const all = read(BENEFITS_KEY, {});
    all[key] = { ...all[key], ...benefit };
    write(BENEFITS_KEY, all);
    const updatedUser = { ...user, points: Number(all[key].points || 0) };
    write(CURRENT_USER_KEY, updatedUser);
    const users = read(USERS_KEY, []);
    if (Array.isArray(users)) {
      const index = users.findIndex((item) => getUserKey(item) === key);
      if (index >= 0) { users[index] = { ...users[index], points: updatedUser.points }; write(USERS_KEY, users); }
    }
    window.dispatchEvent(new CustomEvent('momo-benefits-updated', { detail: all[key] }));
    return all[key];
  };

  const addPoints = (amount) => {
    const benefit = getBenefit();
    if (!benefit) return null;
    return saveBenefit({ ...benefit, points: benefit.points + Math.max(0, Number(amount || 0)) });
  };

  const usePoints = (amount) => {
    const benefit = getBenefit();
    const value = Math.max(0, Math.floor(Number(amount || 0)));
    if (!benefit || value > benefit.points) return false;
    saveBenefit({ ...benefit, points: benefit.points - value });
    return true;
  };

  const addOrderStamp = (orderId) => {
    const benefit = getBenefit();
    if (!benefit || benefit.stampedOrders.some((id) => String(id) === String(orderId))) return { added:false, benefit };
    let stamps = benefit.stamps + 1;
    let rewards = benefit.rewards;
    if (stamps >= 10) { stamps -= 10; rewards += 1; }
    const saved = saveBenefit({ ...benefit, stamps, rewards, stampedOrders:[...benefit.stampedOrders, orderId] });
    return { added:true, rewardEarned: rewards > benefit.rewards, benefit:saved };
  };

  const useReward = () => {
    const benefit = getBenefit();
    if (!benefit || benefit.rewards < 1) return false;
    saveBenefit({ ...benefit, rewards: benefit.rewards - 1 });
    return true;
  };

  const getReviews = () => {
    const key = getUserKey();
    if (!key) return [];
    return read(REVIEWS_KEY, []).filter((review) => review.memberKey === key).sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt));
  };

  const getGrade = (totalSpent = 0) => {
    const amount = Math.max(0, Number(totalSpent || 0));
    const grades = [
      { name:'WELCOME', minimum:0, next:100000, color:'Warm Beige', benefits:['웰컴 쿠폰 1장'] },
      { name:'SILVER', minimum:100000, next:300000, color:'Silver Gray', benefits:['음료 10% 할인 쿠폰 1장'] },
      { name:'GOLD', minimum:300000, next:700000, color:'Gold', benefits:['생일 쿠폰','음료 10% 할인 쿠폰 2장'] },
      { name:'VIP', minimum:700000, next:null, color:'Deep Brown + Gold', benefits:['무료 사이즈업 쿠폰 2장','전용 이벤트','5,000원 할인 쿠폰 2장'] }
    ];
    const currentIndex = amount >= 700000 ? 3 : amount >= 300000 ? 2 : amount >= 100000 ? 1 : 0;
    const current = grades[currentIndex];
    const next = grades[currentIndex + 1] || null;
    const range = current.next ? current.next - current.minimum : 1;
    const progress = current.next ? Math.min(100, Math.max(0, ((amount - current.minimum) / range) * 100)) : 100;
    return { current:current.name, next:next?.name || null, remaining:current.next ? Math.max(0,current.next-amount) : 0, progress, amount, color:current.color, benefits:current.benefits, grades };
  };

  const monthKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
  const formatCouponDate = (date) => `${date.getFullYear()}.${String(date.getMonth()+1).padStart(2,'0')}.${String(date.getDate()).padStart(2,'0')}`;
  const belongsToMember = (record, member = getUser()) => {
    if (!record || !member) return false;
    const identities = [member.id, member.email].filter(Boolean).map((value) => String(value).trim().toLowerCase());
    return [record.memberKey, record.userId, record.userEmail]
      .filter(Boolean)
      .some((value) => identities.includes(String(value).trim().toLowerCase()));
  };
  const getMonthlySpentForMember = (member = getUser(), date = new Date()) => read('momo_coffee_orders_v1', [])
    .filter((order) => {
      const createdAt = new Date(order?.createdAt);
      return belongsToMember(order, member)
        && !Number.isNaN(createdAt.getTime())
        && createdAt.getFullYear() === date.getFullYear()
        && createdAt.getMonth() === date.getMonth()
        && String(order.status || '').toLowerCase() !== 'cancelled'
        && String(order.paymentStatus || '').toLowerCase() !== 'failed';
    })
    .reduce((sum, order) => sum + Math.max(0, Number(order.totalAmount ?? order.total) || 0), 0);
  const syncMonthlyGradeBenefits = (monthlySpent = 0) => {
    const member = getUser();
    if (!member) return null;
    const key = getUserKey(member);
    const grade = getGrade(monthlySpent);
    const period = monthKey();
    const issued = read(GRADE_REWARDS_KEY, {});
    const issueKey = `${key}:${period}:${grade.current}`;
    const coupons = typeof getMomoCoupons === 'function' ? getMomoCoupons() : read(COUPONS_KEY, []);
    const list = Array.isArray(coupons) ? coupons : [];
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth()+1,0);
    const common = { minimumAmount:0, dateLabel:'유효기간', date:formatCouponDate(expiry), status:'available', userId:member.id??member.email, memberKey:key, grade:grade.current, gradePeriod:period, issuedBy:'MEMBERSHIP_GRADE', issuedAt:new Date().toISOString(), used:false, revoked:false };
    const benefits = {
      WELCOME: [
        { rewardKey:`${key}:WELCOME`, type:'WELCOME', label:'MEMBER', title:'신규 회원 웰컴 쿠폰', description:'모든 메뉴 주문 시 4,000원 할인', minimumAmount:8000, maximumDiscount:4000, minimum:'8,000원', maximum:'4,000원', discountType:'fixed', discountValue:4000 }
      ],
      SILVER: [
        { rewardKey:`${key}:${period}:SILVER:DRINK10`, type:'10%', label:'SILVER', title:'SILVER 음료 10% 할인', description:'모든 음료에 사용할 수 있어요.', maximumDiscount:5000, minimum:'제한 없음', maximum:'5,000원', discountType:'percent', discountValue:10, target:'drink' }
      ],
      GOLD: [
        { rewardKey:`${key}:${period}:GOLD:BIRTHDAY`, type:'BIRTHDAY', label:'GOLD', title:'GOLD 생일 축하 쿠폰', description:'생일을 위한 5,000원 할인 혜택', minimumAmount:10000, maximumDiscount:5000, minimum:'10,000원', maximum:'5,000원', discountType:'fixed', discountValue:5000 },
        ...[1,2].map((number) => ({ rewardKey:`${key}:${period}:GOLD:DRINK10:${number}`, type:'10%', label:'GOLD', title:`GOLD 음료 10% 할인 ${number}`, description:'모든 음료에 사용할 수 있어요.', maximumDiscount:5000, minimum:'제한 없음', maximum:'5,000원', discountType:'percent', discountValue:10, target:'drink' }))
      ],
      VIP: [
        ...[1,2].map((number) => ({ rewardKey:`${key}:${period}:VIP:SIZEUP:${number}`, type:'SIZE UP', label:'VIP', title:`VIP 무료 사이즈업 ${number}`, description:'음료 사이즈업 금액을 최대 1,000원 할인', maximumDiscount:1000, minimum:'제한 없음', maximum:'1,000원', discountType:'fixed', discountValue:1000, target:'drink' })),
        ...[1,2].map((number) => ({ rewardKey:`${key}:${period}:VIP:5000:${number}`, type:'5,000원', label:'VIP', title:`VIP 5,000원 할인 ${number}`, description:'10,000원 이상 주문 시 사용할 수 있어요.', minimumAmount:10000, maximumDiscount:5000, minimum:'10,000원', maximum:'5,000원', discountType:'fixed', discountValue:5000 }))
      ]
    };
    const desired = benefits[grade.current] || [];
    const desiredTitles = new Set(desired.map((coupon) => coupon.title));
    const seenTitles = new Set();
    const isGradeCoupon = (coupon) => coupon.issuedBy !== 'ADMIN' && (
      coupon.issuedBy === 'MEMBERSHIP_GRADE'
      || coupon.gradePeriod
      || coupon.rewardKey
      || /^(SILVER|GOLD|VIP)\b/.test(String(coupon.title || ''))
      || String(coupon.title || '').includes('신규 회원 웰컴')
    );

    list.forEach((coupon) => {
      if (!belongsToMember(coupon, member) || !isGradeCoupon(coupon) || coupon.status !== 'available') return;
      const duplicate = desiredTitles.has(coupon.title) && seenTitles.has(coupon.title);
      const wrongGrade = !desiredTitles.has(coupon.title);
      if (duplicate || wrongGrade) {
        coupon.status = 'revoked';
        coupon.revoked = true;
        coupon.revokedAt = new Date().toISOString();
        coupon.revokedReason = duplicate ? '등급 쿠폰 중복 정리' : '현재 회원 등급 변경';
      } else {
        seenTitles.add(coupon.title);
      }
    });

    desired.forEach((coupon) => {
      const exists = list.some((item) => belongsToMember(item, member)
        && !item.revoked
        && (item.rewardKey === coupon.rewardKey || item.title === coupon.title));
      if (!exists) list.unshift({ id:Date.now()+list.length+Math.floor(Math.random()*1000), tone:'pink', target:'all', ...common, ...coupon });
    });

    if (typeof saveMomoCoupons === 'function') saveMomoCoupons(list); else write(COUPONS_KEY,list);
    issued[issueKey] = { issuedAt:new Date().toISOString(), grade:grade.current };
    write(GRADE_REWARDS_KEY,issued);
    if (grade.current === 'WELCOME') {
      const welcomeClaims = read('momo_welcome_claims_v1', {});
      welcomeClaims[key] = welcomeClaims[key] || { claimedAt:new Date().toISOString(), source:'membership-grade' };
      write('momo_welcome_claims_v1', welcomeClaims);
    }
    return grade;
  };

  window.MomoLoyalty = { getUser, getUserKey, getBenefit, saveBenefit, addPoints, usePoints, addOrderStamp, useReward, getReviews, getGrade, monthKey, belongsToMember, getMonthlySpentForMember, syncMonthlyGradeBenefits };
  const currentMember = getUser();
  if (currentMember?.role !== 'ADMIN') syncMonthlyGradeBenefits(getMonthlySpentForMember(currentMember));
})();
