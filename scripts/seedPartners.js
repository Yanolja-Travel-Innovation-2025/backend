const mongoose = require('mongoose');
const Partner = require('../models/Partner');
require('dotenv').config();

// 제주도 제휴점 샘플 데이터
const partnersData = [
  {
    name: '제주도민회관 맛집거리',
    category: '한식',
    location: {
      name: '제주시 중심가',
      coordinates: [126.5219, 33.5101],
      address: '제주특별자치도 제주시 문연로 69'
    },
    discountRate: 10,
    minimumBadges: 1,
    contact: '064-123-4567',
    description: '제주 향토 음식을 맛볼 수 있는 전통 맛집',
    isActive: true
  },
  {
    name: '성산포 횟집',
    category: '해산물',
    location: {
      name: '성산일출봉 근처',
      coordinates: [126.9403, 33.4584],
      address: '제주특별자치도 서귀포시 성산읍 성산리'
    },
    discountRate: 15,
    minimumBadges: 2,
    contact: '064-784-5678',
    description: '성산일출봉 방문 후 신선한 회를 맛볼 수 있는 맛집',
    isActive: true
  },
  {
    name: '카페 더 클리프',
    category: '카페',
    location: {
      name: '협재해수욕장 근처',
      coordinates: [126.2394, 33.3939],
      address: '제주특별자치도 제주시 한림읍 협재리'
    },
    discountRate: 5,
    minimumBadges: 1,
    contact: '064-796-1234',
    description: '협재해수욕장 전망이 아름다운 오션뷰 카페',
    isActive: true
  },
  {
    name: '중문리조트 스파',
    category: '휴양시설',
    location: {
      name: '중문관광단지',
      coordinates: [126.4123, 33.2394],
      address: '제주특별자치도 서귀포시 중문동'
    },
    discountRate: 20,
    minimumBadges: 3,
    contact: '064-738-9012',
    description: '제주 여행의 피로를 풀 수 있는 프리미엄 스파',
    isActive: true
  },
  {
    name: '제주 기념품 전문점',
    category: '쇼핑',
    location: {
      name: '제주공항 근처',
      coordinates: [126.4930, 33.5067],
      address: '제주특별자치도 제주시 공항로'
    },
    discountRate: 8,
    minimumBadges: 1,
    contact: '064-742-3456',
    description: '제주 특산품과 기념품을 한 곳에서 구매할 수 있는 전문점',
    isActive: true
  },
  {
    name: '올레길 게스트하우스',
    category: '숙박',
    location: {
      name: '올레길 7코스 근처',
      coordinates: [126.2654, 33.2450],
      address: '제주특별자치도 서귀포시 남원읍'
    },
    discountRate: 15,
    minimumBadges: 2,
    contact: '064-764-7890',
    description: '올레길 트래킹 여행객을 위한 아늑한 게스트하우스',
    isActive: true
  },
  {
    name: '용두암 맛집',
    category: '해산물',
    location: {
      name: '용두암 근처',
      coordinates: [126.5096, 33.5157],
      address: '제주특별자치도 제주시 용담동'
    },
    discountRate: 12,
    minimumBadges: 1,
    contact: '064-758-2468',
    description: '용두암 구경 후 들르는 신선한 제주 해산물 전문점',
    isActive: true
  },
  {
    name: '섭지코지 펜션',
    category: '숙박',
    location: {
      name: '섭지코지',
      coordinates: [126.9309, 33.4244],
      address: '제주특별자치도 서귀포시 성산읍 섭지코지로'
    },
    discountRate: 18,
    minimumBadges: 3,
    contact: '064-782-1357',
    description: '드라마 촬영지 섭지코지의 아름다운 전망을 즐길 수 있는 펜션',
    isActive: true
  },
  {
    name: '비자림 자연 카페',
    category: '카페',
    location: {
      name: '비자림 입구',
      coordinates: [126.8069, 33.4880],
      address: '제주특별자치도 제주시 구좌읍 비자림로'
    },
    discountRate: 7,
    minimumBadges: 1,
    contact: '064-710-9876',
    description: '천년 비자나무 숲속에서 힐링할 수 있는 자연 친화적 카페',
    isActive: true
  },
  {
    name: '오설록 차 전문점',
    category: '카페',
    location: {
      name: '오설록 티뮤지엄',
      coordinates: [126.2890, 33.3065],
      address: '제주특별자치도 서귀포시 안덕면 신화역사로'
    },
    discountRate: 10,
    minimumBadges: 2,
    contact: '064-794-5555',
    description: '제주 녹차의 본고장에서 즐기는 프리미엄 차 문화 체험',
    isActive: true
  }
];

async function seedPartners() {
  try {
    // MongoDB 연결
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB 연결 성공');

    // 기존 제휴점 데이터 삭제 (옵션)
    await Partner.deleteMany({});
    console.log('기존 제휴점 데이터 삭제 완료');

    // 새 제휴점 데이터 삽입
    const partners = await Partner.insertMany(partnersData);
    console.log(`${partners.length}개의 제휴점 데이터 시딩 완료:`);
    
    partners.forEach((partner, index) => {
      console.log(`${index + 1}. ${partner.name} (${partner.category}) - 할인율: ${partner.discountRate}%, 최소 배지: ${partner.minimumBadges}개`);
    });

    process.exit(0);
  } catch (error) {
    console.error('제휴점 시딩 에러:', error);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  seedPartners();
}

module.exports = { seedPartners, partnersData };