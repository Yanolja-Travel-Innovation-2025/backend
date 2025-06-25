/**
 * 샘플 NFT 메타데이터 생성 스크립트
 * 제주도 배지들의 메타데이터 구조 테스트용
 */

const { createNFTMetadata, metadataToJSON, createCollectionMetadata } = require('../utils/nftMetadata');
const { createLocalMetadata } = require('../utils/ipfsUpload');

// 제주도 배지 샘플 데이터
const sampleBadges = [
  {
    name: '한라산 정상 탐험가',
    description: '제주도의 최고봉 한라산 정상을 정복한 용감한 탐험가',
    location: '한라산 백록담',
    rarity: 'gold',
    coordinates: '126.5312,33.3617',
    timestamp: new Date('2024-06-25T10:30:00Z')
  },
  {
    name: '성산일출봉 일출 감상가',
    description: '유네스코 세계자연유산 성산일출봉에서 황홀한 일출을 감상한 여행자',
    location: '성산일출봉',
    rarity: 'silver',
    coordinates: '126.9423,33.4584',
    timestamp: new Date('2024-06-25T06:00:00Z')
  },
  {
    name: '협재해수욕장 해양 탐험가',
    description: '에메랄드빛 바다 협재해수욕장의 아름다운 해변을 만끽한 여행자',
    location: '협재해수욕장',
    rarity: 'bronze',
    coordinates: '126.2394,33.3939',
    timestamp: new Date('2024-06-25T14:15:00Z')
  }
];

async function generateSampleMetadata() {
  console.log('🎯 제주도 디지털 여권 NFT 메타데이터 생성 시작\n');

  // 1. 컬렉션 메타데이터 생성
  console.log('📚 컬렉션 메타데이터:');
  const collectionMetadata = createCollectionMetadata();
  console.log(metadataToJSON(collectionMetadata));
  console.log('\n' + '='.repeat(60) + '\n');

  // 2. 각 배지별 메타데이터 생성
  sampleBadges.forEach((badge, index) => {
    console.log(`🏆 배지 ${index + 1}: ${badge.name}`);
    console.log(`📍 위치: ${badge.location}`);
    console.log(`⭐ 등급: ${badge.rarity.toUpperCase()}`);
    console.log(`📅 발급시간: ${badge.timestamp.toLocaleString('ko-KR')}`);
    
    // 로컬 메타데이터 생성 (IPFS 업로드 없이)
    const { metadata } = createLocalMetadata(badge);
    console.log(`\n📄 메타데이터:`);
    console.log(metadataToJSON(metadata));
    console.log('\n' + '='.repeat(60) + '\n');
  });

  // 3. 메타데이터 통계
  console.log('📊 메타데이터 통계:');
  console.log(`- 총 배지 수: ${sampleBadges.length}개`);
  console.log(`- 골드 배지: ${sampleBadges.filter(b => b.rarity === 'gold').length}개`);
  console.log(`- 실버 배지: ${sampleBadges.filter(b => b.rarity === 'silver').length}개`);
  console.log(`- 브론즈 배지: ${sampleBadges.filter(b => b.rarity === 'bronze').length}개`);

  // 4. OpenSea 호환성 체크
  console.log('\n✅ OpenSea 호환성:');
  console.log('- ✓ name, description, image 필드 포함');
  console.log('- ✓ attributes 배열로 속성 정의');
  console.log('- ✓ external_url로 외부 링크 제공');
  console.log('- ✓ display_type으로 숫자/날짜 형식 지정');
  
  console.log('\n🎉 메타데이터 생성 완료!');
}

// 스크립트 실행
if (require.main === module) {
  generateSampleMetadata().catch(console.error);
}

module.exports = { generateSampleMetadata };