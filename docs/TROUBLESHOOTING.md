# 🛠 트러블 슈팅

MOMO COFFEE 프로젝트를 진행하면서 단순히 오류 메시지에 맞는 코드를 찾아 붙이는 방식보다, **현재 어떤 계층에서 문제가 발생했는지 확인하고 원인을 좁혀 가는 과정**을 경험했습니다.

처음에는 화면이 제대로 나오지 않으면 CSS부터 수정하고, 기능이 동작하지 않으면 JavaScript를 바로 고치는 경우가 많았습니다.

하지만 프로젝트의 규모가 커지고 배포 환경까지 연결되면서 문제의 원인이 코드가 아니라 다음과 같은 다른 영역에 있을 수도 있다는 것을 알게 되었습니다.

* 파일 경로
* 서버 실행 위치
* Git 브랜치
* 데이터 구조
* 사용자 식별 방식
* 권한 처리
* 배포 환경 설정

그래서 이후에는 다음 순서로 문제를 확인했습니다.

```text
현재 발생한 현상 확인
        ↓
브라우저와 터미널에서 실제 상태 확인
        ↓
파일·경로·데이터·권한·브랜치 중 원인 범위 좁히기
        ↓
최소한의 부분만 수정
        ↓
기존 기능까지 다시 확인
```

아래는 MOMO COFFEE 프로젝트를 진행하며 경험한 대표적인 트러블 슈팅 사례입니다.

---

# 1. Linux 배포 후 CSS가 적용되지 않았던 문제

## 문제 상황

로컬 환경의 Live Server에서는 마이페이지와 결제 페이지가 정상적으로 표시되었습니다.

하지만 Linux 서버에 프로젝트를 배포한 뒤 같은 페이지에 접속하니, HTML 내용은 나오지만 CSS가 전혀 적용되지 않은 것처럼 화면이 무너졌습니다.

대표적으로 다음과 같은 현상이 나타났습니다.

* Header와 Footer 스타일이 사라짐
* 카드와 버튼 디자인이 적용되지 않음
* 메뉴와 결제 화면이 기본 HTML처럼 세로로 출력됨
* 이미지가 원래 크기로 노출됨
* 일부 JavaScript 기능도 정상적으로 실행되지 않음

처음에는 서버에 CSS 파일이 제대로 올라가지 않았다고 생각했습니다.

## 원인 확인 과정

먼저 서버에서 실제 CSS 파일이 존재하는지 확인했습니다.

```bash
ls -l checkout/index.css
ls -l my/index.css
ls -l css/variables.css
ls -l css/nav.css
```

파일은 모두 정상적으로 존재했습니다.

그다음 정적 서버가 CSS 파일을 실제로 반환하고 있는지 확인했습니다.

```bash
curl -I http://localhost:3123/checkout/index.css
curl -I http://localhost:3123/css/variables.css
```

응답은 다음과 같이 정상적이었습니다.

```text
HTTP/1.1 200 OK
Content-Type: text/css; charset=utf-8
```

즉, 문제는 다음 두 가지가 아니었습니다.

* CSS 파일이 서버에 없는 문제 ❌
* 서버가 CSS 파일을 반환하지 않는 문제 ❌

이후 브라우저 개발자 도구의 `Network` 탭에서 HTML이 실제로 요청하는 CSS 주소를 확인했습니다.

그 결과 파일은 존재하지만, HTML의 상대 경로가 현재 URL을 기준으로 잘못 해석되고 있다는 사실을 발견했습니다.

## 실제 원인

프로젝트에서는 다음과 같은 상대 경로를 사용하고 있었습니다.

```html
<link rel="stylesheet" href="../css/variables.css">
<link rel="stylesheet" href="../css/nav.css">
<link rel="stylesheet" href="index.css">
```

로컬에서는 `/checkout/index.html`을 기준으로 정상적으로 해석되었습니다.

하지만 배포 서버에서 사용한 `serve`는 Clean URL을 적용하면서 주소를 다음과 같이 변경했습니다.

```text
/checkout/index.html
        ↓
/checkout/index
        ↓
/checkout
```

브라우저가 현재 주소를 다르게 인식하면서 `index.css`와 공통 CSS의 상대 경로도 예상과 다르게 계산되었습니다.

그 결과 CSS 파일은 존재했지만 잘못된 위치로 요청되고 있었습니다.

## 해결 방법

CSS, JavaScript, 이미지 경로를 프로젝트 루트를 기준으로 작성하는 방식으로 통일했습니다.

### 수정 전

```html
<link rel="stylesheet" href="../css/variables.css">
<link rel="stylesheet" href="index.css">

<script src="../js/utils.js"></script>
<script src="index.js"></script>
```

### 수정 후

```html
<link rel="stylesheet" href="/css/variables.css">
<link rel="stylesheet" href="/checkout/index.css">

<script src="/js/utils.js"></script>
<script src="/checkout/index.js"></script>
```

이미지 경로에도 같은 원칙을 적용했습니다.

```html
<img
  src="/assets/images/momo-header-logo.png"
  alt="MOMO COFFEE"
>
```

수정 후에는 다시 HTTP 응답을 확인했습니다.

```bash
curl -I http://localhost:3123/checkout/index.css
curl -I http://localhost:3123/checkout/index.js
```

브라우저의 `Network` 탭에서도 다음 항목을 확인했습니다.

* CSS 응답 상태 `200`
* JavaScript 응답 상태 `200`
* CSS MIME Type `text/css`
* JavaScript MIME Type 정상
* 브라우저 Console 오류 없음

## 배운 점

이 문제를 통해 다음 원칙을 세우게 되었습니다.

> 파일이 존재하는 것과 브라우저가 올바른 주소로 파일을 요청하는 것은 서로 다른 문제다.

이후 배포 오류가 발생하면 바로 코드를 수정하지 않고 다음 순서로 확인했습니다.

1. 파일이 실제로 존재하는가?
2. 서버가 해당 파일을 반환하는가?
3. 브라우저는 어떤 URL로 요청하고 있는가?
4. 응답 상태와 MIME Type은 정상인가?
5. Clean URL에서 경로가 다르게 해석되지 않는가?

또한 로컬에서 동작했다는 사실만으로 배포 환경에서도 정상이라고 판단해서는 안 된다는 점을 배웠습니다.

---

# 2. Relative Path 문제와 Cannot GET 오류

## 문제 상황

Q&A 기능을 추가한 뒤 내비게이션에는 `1:1 문의` 메뉴가 정상적으로 나타났습니다.

하지만 해당 메뉴를 누르면 다음과 같은 오류가 나타났습니다.

```text
Cannot GET /new-cafe-app/qna/list
```

이후에는 마이페이지와 메뉴 페이지 등 기존 페이지를 눌러도 비슷한 오류가 발생했습니다.

```text
Cannot GET /my/index.html
Cannot GET /menus/list.html
Cannot GET /index.html
```

처음에는 새로 만든 Q&A 파일이 없는 것으로 생각했습니다.

## 원인 확인 과정

먼저 실제 파일이 생성되었는지 확인했습니다.

```bash
find . -maxdepth 3 -type f | grep -Ei 'qna|my|menus'
```

Q&A 관련 파일은 실제로 존재했습니다.

```text
./qna/list.html
./qna/list.css
./qna/list.js
./qna/detail.html
./qna/create.html
./admin/qna/list.html
./admin/qna/detail.html
```

그럼에도 브라우저에서는 `Cannot GET` 오류가 나타났습니다.

이후 현재 실행 중인 서버의 문서 루트와 브라우저 주소를 확인했습니다.

```bash
pwd
npm run start
```

문제는 다음 상황들이 혼합되어 발생한 것이었습니다.

* 프로젝트 폴더가 아닌 다른 위치에서 서버 실행
* Live Server와 `serve` 주소 혼용
* `/new-cafe-app/` 접두사를 링크에 직접 포함
* `.html` 주소와 Clean URL 혼용
* 현재 서버의 문서 루트와 링크 기준 불일치

## 해결 방법

먼저 반드시 프로젝트 폴더에서 서버를 실행하도록 했습니다.

```bash
cd ~/www/new-cafe-app
npm run start
```

브라우저에서는 터미널에 출력된 실제 주소를 사용했습니다.

```text
http://localhost:3123
```

내부 링크에는 배포 디렉터리 이름을 직접 넣지 않고 루트 상대경로를 사용했습니다.

### 잘못된 예

```html
<a href="/new-cafe-app/qna/list">1:1 문의</a>
```

### 수정한 예

```html
<a href="/qna/list">1:1 문의</a>
```

또는 서버 환경에 따라 명시적으로 다음 경로를 사용했습니다.

```html
<a href="/qna/list.html">1:1 문의</a>
```

중요한 것은 프로젝트 전체에서 한 가지 경로 규칙을 일관되게 사용하는 것이었습니다.

## 배운 점

`Cannot GET`은 무조건 파일이 없다는 뜻이 아니었습니다.

다음과 같은 원인도 확인해야 했습니다.

* 파일이 없는 경우
* 서버를 잘못된 폴더에서 실행한 경우
* 브라우저가 다른 서버 포트에 접속한 경우
* 링크에 불필요한 디렉터리명이 포함된 경우
* Clean URL과 실제 파일 경로가 맞지 않는 경우

이후에는 경로 오류가 발생하면 다음 명령어를 먼저 확인했습니다.

```bash
pwd
find . -maxdepth 3 -type f | sort
curl -I http://localhost:3123/qna/list.html
```

---

# 3. Nginx Reverse Proxy 설정 문제

## 문제 상황

프로젝트의 정적 서버는 `3123` 포트에서 실행되었습니다.

```text
http://localhost:3123
```

하지만 실제 사용자에게 포트 번호를 포함한 주소를 제공하는 것은 자연스럽지 않았습니다.

따라서 외부의 `80`번 포트 요청을 내부의 `3123`번 서버로 전달하기 위해 Nginx Reverse Proxy를 설정했습니다.

목표 구조는 다음과 같았습니다.

```text
사용자 요청
   ↓
Nginx :80
   ↓
Node Serve :3123
   ↓
MOMO COFFEE 정적 파일
```

## 설정 과정에서 발생한 문제

Nginx 설정을 처음 작성하면서 다음과 같은 오류를 경험했습니다.

* `server` 블록의 중괄호 누락
* `proxy_set_header` 오타
* 설정 파일 이름과 링크 대상 불일치
* `sites-enabled`에 잘못된 심볼릭 링크 생성
* 이미 존재하는 링크를 다시 연결하며 순환 구조 발생
* 설정을 수정했지만 `reload`하지 않아 반영되지 않음

처음에는 설정 파일만 수정하면 곧바로 적용될 것이라고 생각했습니다.

하지만 Nginx는 설정 파일의 문법 검사와 `reload` 과정이 별도로 필요했습니다.

## 설정 예시

```nginx
server {
    listen 80;

    server_name momocafe.com www.momocafe.com;

    location / {
        proxy_pass http://127.0.0.1:3123;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

설정 파일을 생성한 뒤 활성화 링크를 연결했습니다.

```bash
sudo ln -s \
  /etc/nginx/sites-available/momocafe.com \
  /etc/nginx/sites-enabled/momocafe.com
```

## 문제 해결 과정

설정을 바로 적용하지 않고 먼저 문법을 검사했습니다.

```bash
sudo nginx -t
```

오류가 있으면 Nginx가 해당 파일과 줄 번호를 알려주었습니다.

```text
syntax error
unexpected end of file
unknown directive
```

오류를 수정한 뒤 다시 검사했습니다.

```text
syntax is ok
test is successful
```

정상 결과가 나온 뒤에만 설정을 다시 불러왔습니다.

```bash
sudo systemctl reload nginx
```

그다음 내부 서버와 Nginx를 각각 확인했습니다.

```bash
curl -I http://127.0.0.1:3123
curl -I http://localhost
```

## 배운 점

Nginx 설정은 다음 순서를 지켜야 한다는 것을 배웠습니다.

```text
설정 작성
   ↓
파일과 심볼릭 링크 확인
   ↓
nginx -t
   ↓
reload
   ↓
내부 포트 확인
   ↓
외부 포트 확인
```

문법 검사를 하지 않고 바로 서버를 재시작하면 다른 정상 서비스까지 영향을 받을 수 있습니다.

따라서 설정 검증은 배포 과정에서 반드시 필요한 단계라는 점을 알게 되었습니다.

---

# 4. Git Branch와 Merge 충돌 문제

## 문제 상황

관리자 운영 시스템은 `feat/admin-operations` 브랜치에서 구현했습니다.

작업 후 커밋과 푸시는 정상적으로 완료되었습니다.

```bash
git add .
git commit -m "feat: implement admin operation center and analytics"
git push origin feat/admin-operations
```

원격 브랜치에는 최신 관리자 기능이 존재했지만, `main` 브랜치로 이동해 화면을 확인하니 이전 관리자 화면이 나타났습니다.

처음에는 작업이 사라졌거나 과거 상태로 되돌아간 것으로 생각했습니다.

## 실제 원인

기능 브랜치를 원격 저장소에 푸시한 것과 `main` 브랜치에 병합한 것은 다른 과정이었습니다.

상태는 다음과 같았습니다.

```text
feat/admin-operations
└─ 최신 관리자 기능 존재

main
└─ 아직 해당 기능이 병합되지 않음
```

즉, `push`는 작업을 원격 기능 브랜치에 저장한 것이고, `main`에는 Pull Request와 Merge 과정이 필요했습니다.

## 브랜치를 너무 일찍 삭제한 문제

로컬 브랜치를 다음과 같이 삭제했습니다.

```bash
git branch -d feat/admin-operations
```

하지만 로컬 `main`에는 아직 해당 기능이 병합되지 않은 상태였습니다.

다행히 원격 브랜치가 남아 있었기 때문에 복구할 수 있었습니다.

```bash
git switch -c feat/admin-operations \
  --track origin/feat/admin-operations
```

이후 커밋 로그를 확인했습니다.

```bash
git log --oneline -5
```

최신 작업이 남아 있는 것을 확인한 뒤 Pull Request를 생성해 `main`에 병합했습니다.

## git pull 충돌 문제

원격 `main`을 내려받으려고 했을 때 다음 오류도 발생했습니다.

```text
Your local changes would be overwritten by merge
```

또한 추적되지 않은 파일도 원격 파일과 경로가 겹쳤습니다.

```text
The following untracked working tree files
would be overwritten by merge
```

Git은 로컬 작업을 강제로 덮어쓰지 않기 위해 `pull`을 중단한 것이었습니다.

## 안전하게 해결한 과정

먼저 현재 상태를 확인했습니다.

```bash
git status
```

보존해야 할 작업을 `stash`에 임시 저장했습니다.

```bash
git stash push -u -m "backup before pulling main"
```

`-u` 옵션을 사용해 추적되지 않은 파일도 함께 보관했습니다.

그다음 작업 트리가 깨끗한지 확인했습니다.

```bash
git status
```

원격 `main`을 안전하게 최신화했습니다.

```bash
git pull --ff-only origin main
```

`stash` 내용을 확인한 뒤 필요한 경우에만 복원했습니다.

```bash
git stash list
git stash show --stat stash@{0}
```

이미 원격 `main`에 같은 작업이 포함되어 있다면 무조건 `stash pop`하지 않고 제거했습니다.

```bash
git stash drop stash@{0}
```

## 배운 점

기능 브랜치 작업은 다음 순서로 관리해야 한다는 것을 배웠습니다.

```text
브랜치 생성
   ↓
기능 구현
   ↓
커밋
   ↓
원격 브랜치 푸시
   ↓
Pull Request
   ↓
main 병합
   ↓
main 최신화 확인
   ↓
브랜치 삭제
```

또한 Git 오류가 발생했다고 바로 다음 명령어를 사용하는 것은 위험하다는 점도 알게 되었습니다.

```bash
git reset --hard
git clean -fd
```

이 명령어는 수정 파일과 추적되지 않은 파일을 잃을 수 있으므로, 항상 `git status`와 `git log`를 먼저 확인해야 했습니다.

---

# 5. LocalStorage 데이터 구조 개선

## 문제 상황

초기에는 회원이 로그인하면 이름 정도만 다르게 표시되고, 포인트·쿠폰·누적 주문 금액·주문 내역 등이 다른 회원과 동일하게 보이는 문제가 있었습니다.

예를 들어 A 회원으로 주문한 뒤 B 회원으로 로그인해도 같은 주문과 포인트가 표시될 수 있었습니다.

## 원인

LocalStorage에 데이터를 저장할 때 사용자를 구분하지 않고 전역 데이터처럼 사용했기 때문입니다.

### 잘못된 예

```javascript
localStorage.setItem("momoPoints", "3000");
```

이 구조에서는 현재 로그인한 사람이 누구인지와 관계없이 모든 사용자가 같은 포인트 값을 읽게 됩니다.

또한 주문 데이터에 사용자 식별자가 없으면 어느 회원의 주문인지 구분할 수 없습니다.

## 해결 과정

먼저 회원마다 변경되지 않는 고유 ID를 부여했습니다.

```json
{
  "id": "user-001",
  "email": "member@example.com",
  "name": "모모회원",
  "role": "USER"
}
```

주문과 문의, 쿠폰, 포인트 이력에는 회원 ID를 연결했습니다.

### 주문

```json
{
  "id": "order-001",
  "userId": "user-001",
  "totalAmount": 12000,
  "createdAt": "2026-07-13T10:00:00.000Z"
}
```

### 문의

```json
{
  "id": "inquiry-001",
  "userId": "user-001",
  "title": "쿠폰 문의"
}
```

### 회원 쿠폰

```json
{
  "id": "user-coupon-001",
  "userId": "user-001",
  "couponId": "coupon-001"
}
```

각 페이지에서는 현재 로그인한 사용자의 ID를 기준으로 데이터를 필터링했습니다.

```javascript
const currentUser = getCurrentUser();

const myOrders = orders.filter(
  (order) => String(order.userId) === String(currentUser.id)
);
```

## 고객과 관리자 데이터 동기화

관리자와 고객 데이터를 따로 복사해서 저장하지 않는 것도 중요했습니다.

예를 들어 주문 데이터를 다음처럼 분리하면 문제가 생길 수 있습니다.

```text
customerOrders
adminOrders
```

관리자가 주문 상태를 변경해도 고객 데이터에는 반영되지 않을 수 있기 때문입니다.

그래서 하나의 주문 저장소를 고객과 관리자가 함께 사용하도록 했습니다.

```text
momoOrders
```

관리자는 주문 객체의 상태를 변경하고, 고객은 같은 주문 객체를 조회합니다.

```json
{
  "id": "order-001",
  "userId": "user-001",
  "status": "PREPARING"
}
```

## 기존 데이터 호환

새 필드를 추가하기 전에 만들어진 데이터에는 `userId`나 `status`가 없을 수도 있었습니다.

기존 데이터를 모두 삭제하는 대신, 읽을 때 기본값을 보완하는 정규화 함수를 사용했습니다.

```javascript
function normalizeOrder(order) {
  return {
    ...order,
    status: order.status || "RECEIVED",
    statusHistory: Array.isArray(order.statusHistory)
      ? order.statusHistory
      : []
  };
}
```

## 배운 점

LocalStorage도 데이터를 아무렇게나 저장하면 관리하기 어렵다는 것을 알게 되었습니다.

특히 다음 원칙이 중요했습니다.

* 회원은 `userId`로 구분한다.
* 주문은 `orderId`로 구분한다.
* 메뉴는 `menuId`로 구분한다.
* 문의는 `inquiryId`로 구분한다.
* 다른 데이터는 이 식별자를 참조한다.

이 경험은 이후 데이터베이스의 PK와 FK 개념을 이해하는 데 직접적으로 연결되었습니다.

---

# 6. 관리자 권한 처리

## 문제 상황

일반 회원으로 로그인한 상태에서 관리자 페이지에 접속했을 때 다음 안내가 나타났습니다.

```text
관리자만 접근할 수 있습니다.
```

처음에는 관리자 기능이 잘못 구현된 것으로 생각했고, 관리자용 회원가입 페이지를 별도로 만들어야 하는지 고민했습니다.

## 관리자 가입을 분리하지 않은 이유

일반 회원가입 화면에서 사용자가 직접 관리자 역할을 선택할 수 있다면 누구나 관리자 권한을 얻을 수 있습니다.

따라서 회원가입 시에는 항상 일반 회원 역할만 부여했습니다.

```json
{
  "role": "USER"
}
```

관리자 계정은 개발자가 미리 생성한 시드 계정으로 관리했습니다.

```json
{
  "email": "admin@momocoffee.com",
  "role": "ADMIN"
}
```

로그인은 하나의 화면에서 처리하지만 로그인 결과에 따라 이동 경로를 다르게 구성했습니다.

```text
로그인 성공
   ├─ USER  → 고객 메인 또는 이전 페이지
   └─ ADMIN → 관리자 대시보드
```

## 버튼 숨김만으로는 부족했던 이유

처음에는 관리자 메뉴를 일반 사용자에게 보이지 않게 하면 충분하다고 생각할 수 있었습니다.

하지만 사용자가 주소를 직접 입력하거나 개발자 도구에서 JavaScript 함수를 호출할 수 있습니다.

따라서 다음 두 단계에서 권한을 확인했습니다.

### 페이지 접근 검사

```javascript
const currentUser = getCurrentUser();

if (!currentUser) {
  location.href = "/login.html";
}

if (currentUser.role !== "ADMIN") {
  alert("관리자만 접근할 수 있습니다.");
  location.href = "/";
}
```

### 데이터 변경 함수 내부 검사

```javascript
function updateOrderStatus(orderId, nextStatus) {
  const currentUser = getCurrentUser();

  if (!currentUser || currentUser.role !== "ADMIN") {
    throw new Error("관리자 권한이 필요합니다.");
  }

  // 주문 상태 변경
}
```

메뉴 품절, 포인트 지급, 쿠폰 지급, 문의 답변 등 중요한 함수에서도 다시 관리자 역할을 검사했습니다.

## 로그인 만료와 권한 검사 순서

30분 로그인 세션을 적용하면서 권한 검사 순서도 중요해졌습니다.

```text
현재 로그인 정보 확인
        ↓
세션 만료 여부 확인
        ↓
사용자 role 확인
        ↓
페이지 또는 기능 접근 허용
```

만료된 사용자 객체의 `role`만 확인해서 관리자 접근을 허용하지 않도록 먼저 세션 유효성을 검사했습니다.

## 한계

현재는 LocalStorage 기반의 프론트엔드 프로젝트이므로 브라우저 데이터 자체를 수정하면 권한을 우회할 수 있습니다.

따라서 이 구조는 실제 보안이라기보다는 **프론트엔드 수준의 역할 분리와 UX 접근 제어**입니다.

향후 Spring Boot를 연결하면 서버에서도 다음 검사가 필요합니다.

* 로그인 토큰 검증
* `ADMIN` 역할 검증
* API별 권한 검사
* 회원 데이터 소유권 검사

## 배운 점

다음 두 개념이 서로 다르다는 것을 이해했습니다.

```text
인증(Authentication)
→ 현재 로그인한 사용자가 누구인지 확인

인가(Authorization)
→ 해당 사용자가 이 기능을 사용할 권한이 있는지 확인
```

---

# 7. 메뉴 옵션 데이터 설계

## 문제 상황

처음 메뉴 주문 기능은 메뉴 ID와 수량만 저장하는 단순한 구조였습니다.

하지만 주문 화면을 발전시키면서 다음 옵션이 추가되었습니다.

* 원두
* 사이즈
* HOT·ICED
* 수량
* 상품별 추가 금액
* MD 상품 옵션

그 결과 같은 메뉴라도 선택한 옵션이 다르면 서로 다른 상품으로 처리해야 하는 문제가 생겼습니다.

예를 들어 다음 두 메뉴는 메뉴 ID가 같지만 같은 장바구니 항목으로 합치면 안 됩니다.

```text
바닐라 라떼
모모 블렌드 / Regular / HOT
```

```text
바닐라 라떼
디카페인 / Large / ICED
```

## 초기 문제

메뉴 ID만 비교하면 같은 메뉴로 판단되어 수량이 합쳐졌습니다.

```javascript
const existingItem = cart.find(
  (item) => item.menuId === newItem.menuId
);
```

이 구조에서는 옵션 정보가 달라도 하나의 항목으로 합쳐졌습니다.

## 해결 방법

메뉴 ID와 선택 옵션을 함께 조합한 고유 키를 만들었습니다.

```javascript
function createCartItemKey(item) {
  return [
    item.menuId,
    item.beanId || "",
    item.size || "",
    item.temperature || "",
    item.productOption || ""
  ].join("-");
}
```

장바구니에서는 이 키가 완전히 같을 때만 수량을 증가시켰습니다.

```javascript
const newItemKey = createCartItemKey(newItem);

const existingItem = cart.find(
  (item) => createCartItemKey(item) === newItemKey
);
```

## 메뉴 유형별 옵션 분리

모든 메뉴에 같은 옵션을 보여주는 것도 잘못된 UX였습니다.

초기 리디자인 과정에서는 커피가 아닌 메뉴에도 원두나 HOT·ICED 옵션이 표시될 수 있었습니다.

그래서 메뉴 특성에 따라 옵션을 분리했습니다.

### 커피

* 원두
* 사이즈
* HOT·ICED
* 수량

### 논커피와 티

* 사이즈
* HOT·ICED
* 수량

### 아이스 전용 메뉴

* 사이즈
* ICED 고정
* 수량

### 디저트와 베이커리

* 수량
* 필요한 경우 포장 옵션

### MD 상품

* 색상 또는 제품 옵션
* 용량
* 수량

메뉴 이름에 `커피`라는 단어가 포함됐는지만 판단하지 않고, 카테고리나 `availableOptions` 같은 명시적인 데이터로 옵션을 결정했습니다.

## 가격 계산

Large 사이즈처럼 추가 금액이 있는 옵션도 최종 가격에 포함해야 했습니다.

```javascript
const finalUnitPrice =
  Number(menu.price) +
  Number(selectedSize.extraPrice || 0) +
  Number(selectedOption.extraPrice || 0);
```

장바구니에는 최종 가격뿐 아니라 사용자가 선택한 옵션도 함께 저장했습니다.

```json
{
  "menuId": "menu-001",
  "menuName": "바닐라 라떼",
  "beanId": "bean-decaf",
  "beanName": "디카페인 블렌드",
  "size": "Large",
  "temperature": "ICED",
  "quantity": 2,
  "optionPrice": 1000,
  "finalUnitPrice": 5500
}
```

## 리디자인 후 기능이 사라졌던 문제

메뉴 UI를 감각적으로 리디자인한 뒤 다음 기능이 사라지는 문제도 발생했습니다.

* 장바구니 버튼 누락
* 바로 구매만 남음
* 원두 선택 누락
* 사이즈와 온도 선택 누락

화면 디자인을 다시 만들면서 기존 DOM과 이벤트 연결을 함께 보존하지 못한 것이 원인이었습니다.

이후 리디자인 과정에서는 다음 순서를 적용했습니다.

```text
기존 기능 목록 작성
        ↓
데이터 및 이벤트 구조 확인
        ↓
UI만 재배치
        ↓
기존 기능 다시 연결
        ↓
장바구니·바로 구매 회귀 테스트
```

## 배운 점

메뉴 옵션은 단순한 화면 요소가 아니라 주문 데이터를 구성하는 일부였습니다.

따라서 UI 변경 시에도 다음을 함께 고려해야 했습니다.

* 화면 표시
* 상태 관리
* 가격 계산
* 장바구니 중복 판별
* 주문 저장
* 결제 페이지 전달

---


# 트러블 슈팅을 통해 달라진 문제 해결 방식

프로젝트 초반에는 오류가 발생하면 눈에 보이는 코드부터 수정했습니다.

하지만 배포, 인증, 데이터, Git 문제를 경험하면서 다음과 같은 방식으로 문제를 해결하게 되었습니다.

1. 오류 메시지를 그대로 확인한다.
2. 현재 브랜치와 실행 환경을 확인한다.
3. 파일이 실제로 존재하는지 확인한다.
4. 서버가 어떤 응답을 반환하는지 확인한다.
5. 브라우저가 어떤 URL과 데이터를 사용하는지 확인한다.
6. 원인을 하나씩 제외한다.
7. 최소 범위만 수정한다.
8. 관련된 기존 기능을 다시 테스트한다.

특히 다음 질문을 반복해서 확인하는 습관이 생겼습니다.

* 파일이 존재하는가?
* 서버가 반환하고 있는가?
* 경로가 정확한가?
* 현재 서버의 문서 루트는 어디인가?
* 데이터가 현재 사용자와 연결되어 있는가?
* 현재 사용자에게 권한이 있는가?
* 기능 브랜치에만 있고 `main`에는 없는 것인가?
* UI 수정 과정에서 기존 이벤트가 사라지지 않았는가?

이번 프로젝트의 트러블 슈팅은 단순히 오류를 고친 경험이 아니라, **문제를 작은 단위로 나누고 근거를 확인하며 해결하는 방법을 익힌 과정**이었습니다.
