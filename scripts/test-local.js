const { ethers } = require('hardhat');

/**
 * 로컬 Hardhat 네트워크에서 컨트랙트 테스트
 */
async function testLocalContract() {
  console.log('🧪 로컬 블록체인 네트워크 테스트 시작...');
  
  try {
    // 계정들 가져오기
    const [owner, user1, user2] = await ethers.getSigners();
    console.log('👤 계정 정보:');
    console.log('- 소유자:', owner.address);
    console.log('- 사용자1:', user1.address);
    console.log('- 사용자2:', user2.address);
    
    // 컨트랙트 배포
    console.log('\n📄 JejuBadgeNFT 컨트랙트 배포 중...');
    const JejuBadgeNFT = await ethers.getContractFactory('JejuBadgeNFT');
    const jejuBadgeNFT = await JejuBadgeNFT.deploy(owner.address);
    await jejuBadgeNFT.waitForDeployment();
    
    const contractAddress = await jejuBadgeNFT.getAddress();
    console.log('✅ 컨트랙트 배포 완료:', contractAddress);
    
    // 테스트 배지 데이터
    const testBadges = [
      {
        name: "한라산 정상 탐험가",
        description: "제주도의 최고봉 한라산 정상을 정복한 용감한 탐험가",
        location: "한라산 백록담",
        rarity: 2, // GOLD
        coordinates: "33.3617,126.5312",
        metadata: "data:application/json;base64,eyJ0ZXN0IjoidHJ1ZSIsInR5cGUiOiJnb2xkIn0="
      },
      {
        name: "성산일출봉 일출 감상가", 
        description: "유네스코 세계자연유산 성산일출봉에서 황홀한 일출을 감상한 여행자",
        location: "성산일출봉",
        rarity: 1, // SILVER
        coordinates: "33.4584,126.9423",
        metadata: "data:application/json;base64,eyJ0ZXN0IjoidHJ1ZSIsInR5cGUiOiJzaWx2ZXIifQ=="
      },
      {
        name: "협재해수욕장 해양 탐험가",
        description: "에메랄드빛 바다 협재해수욕장의 아름다운 해변을 만끽한 여행자", 
        location: "협재해수욕장",
        rarity: 0, // BRONZE
        coordinates: "33.3939,126.2394",
        metadata: "data:application/json;base64,eyJ0ZXN0IjoidHJ1ZSIsInR5cGUiOiJicm9uemUifQ=="
      }
    ];
    
    console.log('\n🎫 테스트 배지 발행 시작...');
    
    // 각 사용자에게 배지 발행
    for (let i = 0; i < testBadges.length; i++) {
      const badge = testBadges[i];
      const recipient = i === 0 ? user1.address : user2.address;
      
      console.log(`\n${i + 1}. ${badge.name} 발행 중...`);
      console.log(`   → 받는 사람: ${recipient}`);
      
      const tx = await jejuBadgeNFT.mintBadge(
        recipient,
        badge.name,
        badge.description,
        badge.location,
        badge.rarity,
        badge.coordinates,
        badge.metadata
      );
      
      const receipt = await tx.wait();
      console.log(`   ✅ 발행 완료! 트랜잭션: ${receipt.hash}`);
      
      // 배지 정보 확인
      const tokenId = i;
      const badgeInfo = await jejuBadgeNFT.badges(tokenId);
      console.log(`   📋 배지 정보: ${badgeInfo.name} (${['Bronze', 'Silver', 'Gold'][badgeInfo.rarity]})`);
    }
    
    // 총 발행량 확인
    const totalSupply = await jejuBadgeNFT.totalSupply();
    console.log(`\n📊 총 발행량: ${totalSupply} 개`);
    
    // 사용자별 보유 배지 확인
    console.log('\n👥 사용자별 보유 배지:');
    
    const user1Badges = await jejuBadgeNFT.getUserBadges(user1.address);
    console.log(`- ${user1.address}: ${user1Badges.length}개`);
    for (const tokenId of user1Badges) {
      const badgeInfo = await jejuBadgeNFT.badges(tokenId);
      console.log(`  └ ${badgeInfo.name}`);
    }
    
    const user2Badges = await jejuBadgeNFT.getUserBadges(user2.address);
    console.log(`- ${user2.address}: ${user2Badges.length}개`);
    for (const tokenId of user2Badges) {
      const badgeInfo = await jejuBadgeNFT.badges(tokenId);
      console.log(`  └ ${badgeInfo.name}`);
    }
    
    // 등급별 통계
    const user1Stats = await jejuBadgeNFT.getBadgeCountByRarity(user1.address);
    const user2Stats = await jejuBadgeNFT.getBadgeCountByRarity(user2.address);
    
    console.log('\n📈 등급별 통계:');
    console.log(`User1 - Bronze: ${user1Stats[0]}, Silver: ${user1Stats[1]}, Gold: ${user1Stats[2]}`);
    console.log(`User2 - Bronze: ${user2Stats[0]}, Silver: ${user2Stats[1]}, Gold: ${user2Stats[2]}`);
    
    // 중복 발급 테스트
    console.log('\n🔄 중복 발급 방지 테스트...');
    try {
      await jejuBadgeNFT.mintBadge(
        user1.address,
        testBadges[0].name, // 이미 발급된 배지명
        testBadges[0].description,
        testBadges[0].location,
        testBadges[0].rarity,
        testBadges[0].coordinates,
        testBadges[0].metadata
      );
      console.log('❌ 중복 발급 방지 실패!');
    } catch (error) {
      console.log('✅ 중복 발급 방지 성공:', error.reason || error.message);
    }
    
    console.log('\n🎉 모든 테스트 완료!');
    console.log('📍 컨트랙트 주소:', contractAddress);
    console.log('💡 이 주소를 .env 파일의 NFT_CONTRACT_ADDRESS에 설정하세요');
    
    return {
      contractAddress,
      owner: owner.address,
      totalSupply: totalSupply.toString()
    };
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error);
    throw error;
  }
}

// 스크립트 실행
if (require.main === module) {
  testLocalContract()
    .then((result) => {
      console.log('\n✅ 테스트 결과:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 테스트 실패:', error);
      process.exit(1);
    });
}

module.exports = { testLocalContract };