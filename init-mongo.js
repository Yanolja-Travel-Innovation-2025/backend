// MongoDB 초기화 스크립트
// Docker 컨테이너 시작 시 자동 실행됨

db = db.getSiblingDB('yanolja');

// 배지 컬렉션 생성 및 초기 데이터 삽입
db.badges.insertMany([
  {
    name: '한라산 정상 탐험가',
    description: '제주도의 최고봉 한라산 정상을 정복한 용감한 탐험가',
    image: 'https://images.unsplash.com/photo-1579834410263-41c3075a359b?q=80&w=1974&auto=format&fit=crop',
    location: {
      name: '한라산 백록담',
      coordinates: [126.5312, 33.3617],
      qrCode: 'HALLASAN_SUMMIT_2024'
    },
    rarity: 'gold',
    isActive: true,
    createdAt: new Date()
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
    isActive: true,
    createdAt: new Date()
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
    isActive: true,
    createdAt: new Date()
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
    isActive: true,
    createdAt: new Date()
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
    isActive: true,
    createdAt: new Date()
  }
]);

print('✅ 제주도 디지털 여권 배지 데이터 초기화 완료!');
print('총 5개 배지가 생성되었습니다:');
print('- 한라산 정상 탐험가 (Gold)');
print('- 성산일출봉 일출 감상가 (Silver)');
print('- 우도 자전거 일주자 (Silver)');
print('- 협재해수욕장 해양 탐험가 (Bronze)');
print('- 올레길 7코스 완주자 (Bronze)'); 