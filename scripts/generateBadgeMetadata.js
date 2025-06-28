const { createNFTMetadata, generateBadgeImageUrl } = require('../utils/nftMetadata');
const { createLocalMetadata } = require('../utils/ipfsUpload');
const { badgesData } = require('./seedBadges');

/**
 * 모든 배지에 대한 NFT 메타데이터 미리 생성
 */
async function generateAllBadgeMetadata() {
  console.log('🎨 배지 NFT 메타데이터 생성 시작...');
  
  const updatedBadgesData = badgesData.map((badge, index) => {
    try {
      // 이미지 URL 생성
      const imageUrl = generateBadgeImageUrl(badge.name, badge.rarity);
      
      // NFT 메타데이터 생성
      const coordinates = badge.location.coordinates ? 
        `${badge.location.coordinates[1]},${badge.location.coordinates[0]}` : '';
      
      const metadataObj = createNFTMetadata({
        name: badge.name,
        description: badge.description,
        location: badge.location.name,
        rarity: badge.rarity,
        coordinates: coordinates,
        imageUrl: imageUrl,
        timestamp: new Date('2024-01-01') // 기본 타임스탬프
      });
      
      // 로컬 메타데이터 URI 생성
      const localData = createLocalMetadata({
        name: badge.name,
        description: badge.description,
        location: badge.location.name,
        rarity: badge.rarity,
        coordinates: coordinates,
        timestamp: new Date('2024-01-01')
      });
      
      console.log(`✅ ${index + 1}. ${badge.name} 메타데이터 생성 완료`);
      
      return {
        ...badge,
        nft: {
          metadataUri: localData.metadataUrl,
          imageUri: imageUrl,
          isNftEnabled: true
        }
      };
    } catch (error) {
      console.error(`❌ ${badge.name} 메타데이터 생성 실패:`, error.message);
      return {
        ...badge,
        nft: {
          isNftEnabled: false
        }
      };
    }
  });
  
  console.log(`🎉 총 ${updatedBadgesData.length}개 배지 메타데이터 생성 완료!`);
  return updatedBadgesData;
}

// 메타데이터가 포함된 배지 데이터를 파일로 저장
async function saveBadgeMetadataToFile() {
  const fs = require('fs').promises;
  const path = require('path');
  
  try {
    const updatedBadges = await generateAllBadgeMetadata();
    
    const outputPath = path.join(__dirname, 'badgesWithMetadata.json');
    await fs.writeFile(outputPath, JSON.stringify(updatedBadges, null, 2));
    
    console.log(`📄 메타데이터가 포함된 배지 데이터를 ${outputPath}에 저장했습니다.`);
    
    // 샘플 메타데이터 출력
    console.log('\n📋 샘플 메타데이터:');
    if (updatedBadges.length > 0) {
      const sampleBadge = updatedBadges[0];
      console.log(`이름: ${sampleBadge.name}`);
      console.log(`등급: ${sampleBadge.rarity}`);
      console.log(`이미지 URI: ${sampleBadge.nft?.imageUri}`);
      console.log(`메타데이터 길이: ${sampleBadge.nft?.metadataUri?.length} 문자`);
    }
    
    return updatedBadges;
  } catch (error) {
    console.error('❌ 메타데이터 파일 저장 실패:', error);
    throw error;
  }
}

// 스크립트 직접 실행
if (require.main === module) {
  saveBadgeMetadataToFile()
    .then(() => {
      console.log('✅ 메타데이터 생성 작업 완료!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 메타데이터 생성 실패:', error);
      process.exit(1);
    });
}

module.exports = {
  generateAllBadgeMetadata,
  saveBadgeMetadataToFile
};