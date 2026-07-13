# ☕ MOMO COFFEE

모모커피(MOMO COFFEE)는 실제 프랜차이즈 카페 서비스를 목표로 설계한 주문 웹 애플리케이션이자 

**멋사 백엔드 부트캠프 26기 1차 기초 프로젝트**입니다. 

고객은 메뉴를 조회하고 장바구니에 담아 주문할 수 있으며, 관리자는 메뉴와 주문을 관리할 수 있습니다.

단순한 메뉴 조회 페이지가 아닌 **회원, 주문, 결제, 멤버십, 관리자, 운영 시스템**까지 하나의 서비스 흐름으로 구현했으며, 

실제 카페 브랜드를 운영한다는 관점에서 사용자와 관리자의 기능을 분리하고 CRUD 기반의 화면 설계를 연습하는 것을 목표로 개발했습니다.

스타벅스, 블루보틀, 투썸플레이스 등의 실제 카페의서비스를 참고하여 **브랜드 아이덴티티**, **사용자 경험(UX)**,  **운영 효율성**을 함께 고려한 프로젝트입니다. 

---

#  프로젝트 미리보기


### 🏠 메인 페이지

<img width="1758" height="798" alt="스크린샷 2026-07-13 164758" src="https://github.com/user-attachments/assets/f494f420-10ac-4404-a319-fd42c9be82d1" />



---

### ☕ 메뉴 및 주문

<img width="1078" height="766" alt="image" src="https://github.com/user-attachments/assets/084e7bd3-ae0d-4c57-88af-74a31512f5a4" />
<img width="808" height="670" alt="image" src="https://github.com/user-attachments/assets/b5b68b84-28fb-401c-9e5a-ee0a9d07ee67" />


---

### 🛒 장바구니 & 결제

<img width="902" height="722" alt="스크린샷 2026-07-13 165049" src="https://github.com/user-attachments/assets/c647f8af-85ae-4eed-b6ce-58c1bee59934" />
<img width="698" height="887" alt="스크린샷 2026-07-13 165105" src="https://github.com/user-attachments/assets/c50c38d9-34a0-424d-ba8f-6d9321531ec9" />


---

### 👤 마이페이지

<img width="906" height="849" alt="image" src="https://github.com/user-attachments/assets/25a3a96c-d1c9-4171-ac18-561df3397228" />


---

### ⚙️ 관리자 시스템

<img width="1443" height="911" alt="image" src="https://github.com/user-attachments/assets/6388bfa8-3441-48be-bd3e-e22456921ec0" />


---

# 1. 프로젝트 목표

이번 프로젝트는 단순한 HTML/CSS 예제가 아닌 **실제 서비스를 설계하고 구현하는 경험**을 목표로 진행했습니다.

### 주요 목표

- 실제 프랜차이즈 카페 수준의 사용자 경험(UI/UX) 구현
- 고객과 관리자가 함께 사용하는 서비스 구조 설계
- 브랜드 아이덴티티를 고려한 감성적인 UI 디자인
- LocalStorage 기반 데이터 관리 및 화면 간 데이터 연동
- 관리자 운영 시스템 구현
- 추후 Spring Boot + Database 환경으로 확장 가능한 구조 설계

---

# 2. # ✨ 주요 기능

| 구분 | 구현 내용 |
|------|-----------|
| 👤 회원 | 회원가입, 로그인, 30분 세션 유지 |
| ☕ 메뉴 | 메뉴 조회, 검색, 카테고리 필터, 정렬 |
| 🫘 옵션 | 원두 선택, 사이즈 선택, HOT/ICE 선택 |
| 🥤 주문 | 장바구니, 바로 구매, 주문 내역 |
| 💳 결제 | 쿠폰, 포인트, 결제 금액 계산 |
| ⭐ 멤버십 | 회원 등급, 포인트, 쿠폰 |
| ❤️ 찜 | 찜한 메뉴 관리 |
| 📢 커뮤니티 | 공지사항, 이벤트, FAQ , 1:1 문의 |
| 👨‍💼 관리자 | 대시보드, 메뉴 관리, 주문 관리 |
| 📊 운영 | 회원 관리, 쿠폰, 포인트, 통계 분석 |

---

---

# 3. Milestones

| 단계 | 목표 | 완료 기준 |
|------|------|-----------|
| Step 1 | 프로젝트 구조 설계 | 폴더 구조 및 기본 화면 생성 |
| Step 2 | 고객 메뉴 조회 | 메뉴 목록 및 상세 화면 |
| Step 3 | 관리자 메뉴 관리 | CRUD 화면 구현 |
| Step 4 | 장바구니 | 담기, 삭제, 수량 변경 |
| Step 5 | 주문 | 주문 완료 기능 |
| Step 6 | 고객 주문 내역 | 주문 완료 및 주문 확인 |
| Step 7 | 마이페이지 | 사용자 정보 및 주문 내역 |
| Step 8 | 관리자 | 대시보드 및 주문 관리 |
| Step 9 | 고객 | 회원가입 및 로그인 |
.
.

---



# 4. 🛠 기술 스택  (수정 예정)

## Frontend

- HTML5
- CSS3
- JavaScript (ES6)

## UI / UX

- Responsive Web


## Data

- LocalStorage

## Deployment

- Linux
- Nginx
- Serve

## Version Control

- Git
- GitHub

## Design

- AI Image Generation (Brand Assets)

---

# 5. 시스템 구조도

```text
                    USER

                      │

           로그인 / 회원가입

                      │

              MOMO COFFEE

        HTML + CSS + JavaScript

                      │

              LocalStorage

        ┌─────────────┴─────────────┐

      Customer                  Admin

        │                           │

메뉴 / 주문 / 결제           메뉴 관리

마이페이지                 주문 관리

쿠폰 / 포인트             회원 관리

1:1 문의                 문의 답변

                         운영 통계
```

# 6. 화면 흐름도 (User Flow)

```text
회원가입

      │

로그인

      │

메인 페이지

      │

메뉴 조회

      │

메뉴 상세

      │

옵션 선택

      │

장바구니

      │

결제

      │

주문 완료

      │

주문 내역

      │

마이페이지

      │

1:1 문의
```

관리자

```text
관리자 로그인

      │

Dashboard

      │

메뉴 관리

      │

주문 관리

      │

회원 관리

      │

문의 관리

      │

운영 통계
```

---

# 7.  ERD (수정 예정)

> ERD 이미지 삽입 예정

```text
User

Order

OrderItem

Menu

Category

Coupon

PointHistory

Inquiry

Notice

Event
```
---


# 8. 폴더 구조

```text
new-cafe-app

├── admin
│   ├── menus
│   ├── orders
│   ├── members
│   ├── rewards
│   ├── qna
│   ├── analytics
│   ├── operations
│   ├── activity
│   └── settings
│
├── assets
│   ├── images
│   └── icons
│
├── basket
├── checkout
├── community
├── coupon
├── liked-menu
├── menus
├── my
├── orders
├── qna
├── stores
├── story
│
├── css
├── js
│
├── index.html
├── login.html
└── signup.html
```

---

#  프로젝트 구조

프로젝트는 크게 **고객(Customer)** 과 **관리자(Admin)** 영역으로 구성되어 있습니다.

### 고객 영역

- 메인 페이지
- 메뉴 조회
- 장바구니
- 주문
- 결제
- 마이페이지
- 멤버십
- 공지사항
- 이벤트
- FAQ
- 1:1 문의

### 관리자 영역

- Dashboard
- 메뉴 관리
- 주문 관리
- 회원 관리
- 쿠폰 관리
- 포인트 관리
- 문의 답변
- 운영 통계
- 시스템 설정

---



# 9. 트러블 슈팅 (수정 예정)

프로젝트를 진행하며 다양한 문제를 경험하고 해결했습니다.

대표적인 사례

- Linux 배포 후 CSS 미적용 문제
- Relative Path 문제 해결
- Nginx Reverse Proxy 설정
- Git Branch 및 Merge 충돌 해결
- LocalStorage 데이터 구조 개선
- 관리자 권한 처리
- 메뉴 옵션 데이터 설계
- Responsive Layout 개선

👉 자세한 내용은 아래 문서를 참고해주세요.

```
docs/TROUBLESHOOTING.md
```

---

# 8. 실행 방법

### 프로젝트 Clone

```bash
git clone https://github.com/jangabc3/new-cafe-app.git
```

### 프로젝트 이동

```bash
cd new-cafe-app
```

### 의존성 설치

```bash
npm install
```

### 실행

```bash
npm start
```

기본 실행 주소

```
http://localhost:3123
```

---

# 10. 향후 개선 계획

현재 프로젝트는 향후 실제 서비스 수준으로 확장할 계획입니다.

### Backend

- Spring Boot
- Spring Security
- JWT Authentication
- JPA
- MySQL

### Infra

- Docker
- GitHub Actions
- AWS EC2
- Nginx

### Feature

- 실시간 주문(WebSocket)
- Push Notification
- 결제 API 연동
- 관리자 실시간 Dashboard
- Redis Cache
- 이미지 업로드
- 관리자 권한 세분화


---

## 👨‍💻 Developer

**장준영**

Backend Developer를 목표로 학습 중이며,

실제 서비스를 설계하고 구현하는 과정을 기록하며 꾸준히 성장하고 있습니다.

GitHub : https://github.com/jangabc3
