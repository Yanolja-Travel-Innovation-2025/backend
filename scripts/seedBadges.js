const mongoose = require('mongoose');
const Badge = require('../models/Badge');
require('dotenv').config();

// 제주도 실제 관광지 배지 데이터
const badgesData = [
  {
    name: '한라산 정상 탐험가',
    description: '제주도의 최고봉 한라산 정상을 정복한 용감한 탐험가',
    image: 'https://images.unsplash.com/photo-1579834410263-41c3075a359b?q=80&w=1974&auto=format&fit=crop',
    location: {
      name: '한라산 백록담',
      coordinates: [126.5312, 33.3617], // [경도, 위도]
      qrCode: 'HALLASAN_SUMMIT_2024'
    },
    rarity: 'gold',
    isActive: true
  },
  {
    name: '성산일출봉 일출 감상가',
    description: '유네스코 세계자연유산 성산일출봉에서 황홀한 일출을 감상한 여행자',
    image: 'https://images.unsplash.com/photo-1520637836862-4d197d17c23a?q=80&w=2000&auto=format&fit=crop',
    location: {
      name: '성산일출봉',
      coordinates: [126.9423, 33.4584],
      qrCode: 'SEONGSAN_SUNRISE_2024'
    },
    rarity: 'silver',
    isActive: true
  },
  {
    name: '우도 자전거 일주자',
    description: '섬 속의 작은 섬 우도를 자전거로 일주한 모험가',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2000&auto=format&fit=crop',
    location: {
      name: '우도 등대',
      coordinates: [126.9502, 33.5064],
      qrCode: 'UDO_LIGHTHOUSE_2024'
    },
    rarity: 'silver',
    isActive: true
  },
  {
    name: '협재해수욕장 해양 탐험가',
    description: '에메랄드빛 바다 협재해수욕장의 아름다운 해변을 만끽한 여행자',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=2000&auto=format&fit=crop',
    location: {
      name: '협재해수욕장',
      coordinates: [126.2394, 33.3939],
      qrCode: 'HYEOPJAE_BEACH_2024'
    },
    rarity: 'bronze',
    isActive: true
  },
  {
    name: '올레길 7코스 완주자',
    description: '제주 올레길 7코스(독립바위~월평)를 완주한 올레꾼',
    image: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?q=80&w=2000&auto=format&fit=crop',
    location: {
      name: '올레길 7코스 시작점',
      coordinates: [126.2654, 33.2450],
      qrCode: 'OLLE_TRAIL_7_2024'
    },
    rarity: 'bronze',
    isActive: true
  },
  {
    name: '정방폭포 마이너스 이온 체험가',
    description: '바다로 떨어지는 신비로운 정방폭포의 마이너스 이온을 흠뻑 마신 여행자',
    image: 'https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?q=80&w=2000&auto=format&fit=crop',
    location: {
      name: '정방폭포',
      coordinates: [126.8547, 33.2444],
      qrCode: 'JEONGBANG_WATERFALL_2024'
    },
    rarity: 'silver',
    isActive: true
  },
  {
    name: '천지연폭포 밤의 탐험가',
    description: '야간 조명이 아름다운 천지연폭포의 환상적인 밤 풍경을 체험한 여행자',
    image: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?q=80&w=2000&auto=format&fit=crop',
    location: {
      name: '천지연폭포',
      coordinates: [126.5570, 33.2471],
      qrCode: 'CHEONJIYEON_WATERFALL_2024'
    },
    rarity: 'bronze',
    isActive: true
  },
  {
    name: '만장굴 지하 세계 탐험가',
    description: '유네스코 세계자연유산 만장굴의 신비로운 지하 세계를 탐험한 모험가',
    image: 'https://images.unsplash.com/photo-1446329813274-7c9036bd9a1f?q=80&w=2000&auto=format&fit=crop',
    location: {
      name: '만장굴',
      coordinates: [126.7715, 33.5270],
      qrCode: 'MANJANGGUL_CAVE_2024'
    },
    rarity: 'gold',
    isActive: true
  },
  {
    name: '용두암 용의 전설 탐구자',
    description: '용이 하늘로 승천하다 돌이 되었다는 전설의 용두암을 찾은 여행자',
    image: 'https://images.unsplash.com/photo-1484804959297-65e7c19d7c9f?q=80&w=2000&auto=format&fit=crop',
    location: {
      name: '용두암',
      coordinates: [126.5096, 33.5157],
      qrCode: 'YONGDUAM_ROCK_2024'
    },
    rarity: 'bronze',
    isActive: true
  },
  {
    name: '섭지코지 드라마 속 주인공',
    description: '드라마와 영화의 배경이 된 아름다운 섭지코지에서 로맨틱한 순간을 만끽한 여행자',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2000&auto=format&fit=crop',
    location: {
      name: '섭지코지',
      coordinates: [126.9309, 33.4244],
      qrCode: 'SEOPJIKOJI_2024'
    },
    rarity: 'silver',
    isActive: true
  },
  {
    name: '곽지해수욕장 서핑 도전자',
    description: '제주 서부 곽지해수욕장에서 파도와 함께 춤춘 서핑 도전자',
    image: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?q=80&w=2000&auto=format&fit=crop',
    location: {
      name: '곽지해수욕장',
      coordinates: [126.3040, 33.4503],
      qrCode: 'GWAKJI_BEACH_2024'
    },
    rarity: 'bronze',
    isActive: true
  },
  {
    name: '오설록 티뮤지엄 차 문화 전문가',
    description: '제주의 녹차 문화를 깊이 있게 체험한 차 문화 애호가',
    image: 'https://images.unsplash.com/photo-1563822249548-d3eed65a8b7c?q=80&w=2000&auto=format&fit=crop',
    location: {
      name: '오설록 티뮤지엄',
      coordinates: [126.2890, 33.3065],
      qrCode: 'OSULLOC_MUSEUM_2024'
    },
    rarity: 'bronze',
    isActive: true
  },
  {
    name: '한라산 영실 기암괴석 탐방자',
    description: '한라산 영실코스의 웅장한 기암괴석과 오백나한을 감상한 자연 애호가',
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2000&auto=format&fit=crop',
    location: {
      name: '한라산 영실휴게소',
      coordinates: [126.4982, 33.3520],
      qrCode: 'HALLASAN_YEONGSIL_2024'
    },
    rarity: 'silver',
    isActive: true
  },
  {
    name: '비자림 숲속 힐링 마스터',
    description: '천년의 비자나무들이 만든 신비로운 숲에서 자연 치유를 경험한 힐링 전문가',
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2000&auto=format&fit=crop',
    location: {
      name: '비자림',
      coordinates: [126.8069, 33.4880],
      qrCode: 'BIJARIM_FOREST_2024'
    },
    rarity: 'silver',
    isActive: true
  },
  {
    name: '중문관광단지 휴양 마스터',
    description: '제주 최대 휴양지 중문관광단지에서 완벽한 휴식을 만끽한 휴양 전문가',
    image: 'https://images.unsplash.com/photo-1580541832626-2a7131ee809f?q=80&w=2000&auto=format&fit=crop',
    location: {
      name: '중문관광단지',
      coordinates: [126.4123, 33.2394],
      qrCode: 'JUNGMUN_RESORT_2024'
    },
    rarity: 'bronze',
    isActive: true
  }
];

async function seedBadges() {
  try {
    // MongoDB 연결
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB 연결 성공');

    // 기존 배지 데이터 삭제 (옵션)
    await Badge.deleteMany({});
    console.log('기존 배지 데이터 삭제 완료');

    // 새 배지 데이터 삽입
    const badges = await Badge.insertMany(badgesData);
    console.log(`${badges.length}개의 배지 데이터 시딩 완료:`);
    
    badges.forEach((badge, index) => {
      console.log(`${index + 1}. ${badge.name} (${badge.rarity}) - ID: ${badge._id}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('시딩 에러:', error);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  seedBadges();
}

module.exports = { seedBadges, badgesData }; 