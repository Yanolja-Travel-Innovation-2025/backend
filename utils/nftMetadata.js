/**
 * NFT 메타데이터 구조 정의 및 생성 유틸리티
 * ERC-721 및 OpenSea 표준을 따름
 */

// 배지 등급별 색상 정의
const BADGE_COLORS = {
  bronze: '#CD7F32',
  silver: '#C0C0C0', 
  gold: '#FFD700'
};

// 배지 등급별 속성 점수
const RARITY_SCORES = {
  bronze: 1,
  silver: 2,
  gold: 3
};

/**
 * NFT 메타데이터 생성
 * @param {Object} badgeData 배지 정보
 * @param {string} badgeData.name 배지 이름
 * @param {string} badgeData.description 배지 설명
 * @param {string} badgeData.location 관광지 위치
 * @param {string} badgeData.rarity 배지 등급 (bronze/silver/gold)
 * @param {string} badgeData.coordinates GPS 좌표
 * @param {string} badgeData.imageUrl 배지 이미지 URL
 * @param {Date} badgeData.timestamp 발급 시간
 * @returns {Object} NFT 메타데이터 객체
 */
function createNFTMetadata(badgeData) {
  const {
    name,
    description,
    location,
    rarity,
    coordinates,
    imageUrl,
    timestamp
  } = badgeData;

  // 좌표 파싱
  const [lng, lat] = coordinates.split(',').map(coord => parseFloat(coord.trim()));

  const metadata = {
    // 기본 NFT 정보
    name: `🏆 ${name}`,
    description: `${description}\n\n📍 위치: ${location}\n📅 획득일: ${new Date(timestamp).toLocaleDateString('ko-KR')}`,
    image: imageUrl,
    
    // 외부 링크
    external_url: `https://jejupassport.com/badge/${encodeURIComponent(name)}`,
    
    // 배지별 속성 (OpenSea에서 필터링/정렬 가능)
    attributes: [
      {
        trait_type: "위치",
        value: location
      },
      {
        trait_type: "등급", 
        value: rarity.toUpperCase()
      },
      {
        trait_type: "희소성 점수",
        value: RARITY_SCORES[rarity],
        display_type: "number"
      },
      {
        trait_type: "발급 연도",
        value: new Date(timestamp).getFullYear(),
        display_type: "date"
      },
      {
        trait_type: "발급 월",
        value: new Date(timestamp).getMonth() + 1,
        display_type: "number"
      },
      {
        trait_type: "위도",
        value: lat,
        display_type: "number"
      },
      {
        trait_type: "경도", 
        value: lng,
        display_type: "number"
      },
      {
        trait_type: "색상",
        value: BADGE_COLORS[rarity]
      }
    ],

    // 제주도 디지털 여권 컬렉션 정보
    collection: {
      name: "제주도 디지털 관광 여권",
      family: "Jeju Digital Passport"
    },

    // 추가 메타데이터
    properties: {
      category: "Travel Badge",
      region: "제주도",
      country: "대한민국",
      coordinates: {
        latitude: lat,
        longitude: lng
      },
      rarity_color: BADGE_COLORS[rarity],
      issued_timestamp: timestamp,
      version: "1.0"
    }
  };

  return metadata;
}

/**
 * 배지 이미지 URL 생성 (IPFS 또는 CDN)
 * @param {string} badgeName 배지 이름
 * @param {string} rarity 배지 등급
 * @returns {string} 이미지 URL
 */
function generateBadgeImageUrl(badgeName, rarity) {
  // 실제 구현에서는 IPFS 또는 CDN URL을 사용
  const baseUrl = process.env.BADGE_IMAGE_BASE_URL || 'https://api.jejupassport.com/images/badges';
  const fileName = `${badgeName.replace(/\s+/g, '_').toLowerCase()}_${rarity}.png`;
  return `${baseUrl}/${fileName}`;
}

/**
 * 메타데이터를 IPFS에 업로드할 JSON 형태로 변환
 * @param {Object} metadata NFT 메타데이터
 * @returns {string} JSON 문자열
 */
function metadataToJSON(metadata) {
  return JSON.stringify(metadata, null, 2);
}

/**
 * 배지 컬렉션 정보 생성
 * @returns {Object} 컬렉션 메타데이터
 */
function createCollectionMetadata() {
  return {
    name: "제주도 디지털 관광 여권",
    description: "제주도의 아름다운 관광지를 방문하고 수집하는 NFT 배지 컬렉션입니다. 각 배지는 실제 GPS 위치 인증을 통해 발급되며, 관광객들의 특별한 여행 경험을 영구히 보존합니다.",
    image: "https://api.jejupassport.com/images/collection_cover.png",
    external_link: "https://jejupassport.com",
    seller_fee_basis_points: 250, // 2.5% 로열티
    fee_recipient: process.env.ROYALTY_RECIPIENT || "0x0000000000000000000000000000000000000000"
  };
}

/**
 * 배지별 희소성 분석
 * @param {Array} allBadges 모든 배지 데이터
 * @returns {Object} 희소성 분석 결과
 */
function analyzeBadgeRarity(allBadges) {
  const rarityCount = {
    bronze: 0,
    silver: 0,
    gold: 0
  };

  const locationCount = {};

  allBadges.forEach(badge => {
    rarityCount[badge.rarity]++;
    locationCount[badge.location] = (locationCount[badge.location] || 0) + 1;
  });

  return {
    totalBadges: allBadges.length,
    rarityDistribution: rarityCount,
    locationDistribution: locationCount,
    averageRarityScore: allBadges.reduce((sum, badge) => sum + RARITY_SCORES[badge.rarity], 0) / allBadges.length
  };
}

module.exports = {
  createNFTMetadata,
  generateBadgeImageUrl,
  metadataToJSON,
  createCollectionMetadata,
  analyzeBadgeRarity,
  BADGE_COLORS,
  RARITY_SCORES
};