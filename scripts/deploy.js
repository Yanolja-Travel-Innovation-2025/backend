const { ethers } = require('hardhat');
require('dotenv').config();

async function main() {
  console.log('🚀 제주도 디지털 여권 NFT 컨트랙트 배포 시작...');
  
  try {
    // 배포할 계정 정보 가져오기
    const [deployer] = await ethers.getSigners();
    console.log('📝 배포 계정:', deployer.address);
    
    // 계정 잔액 확인
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log('💰 계정 잔액:', ethers.formatEther(balance), 'ETH');
    
    // 최소 잔액 확인 (테스트넷 기준)
    const minBalance = ethers.parseEther('0.01'); // 0.01 ETH
    if (balance < minBalance) {
      throw new Error(`❌ 잔액 부족! 최소 ${ethers.formatEther(minBalance)} ETH 필요`);
    }
    
    // 네트워크 정보 확인
    const network = await ethers.provider.getNetwork();
    console.log('🌐 배포 네트워크:', network.name, '(Chain ID:', network.chainId.toString() + ')');
    
    // JejuBadgeNFT 컨트랙트 배포
    console.log('\n📄 JejuBadgeNFT 컨트랙트 컴파일 중...');
    const JejuBadgeNFT = await ethers.getContractFactory('JejuBadgeNFT');
    
    console.log('🚀 컨트랙트 배포 중...');
    const jejuBadgeNFT = await JejuBadgeNFT.deploy(deployer.address);
    
    // 배포 대기
    await jejuBadgeNFT.waitForDeployment();
    const contractAddress = await jejuBadgeNFT.getAddress();
    
    console.log('✅ 배포 성공!');
    console.log('📍 컨트랙트 주소:', contractAddress);
    console.log('👤 소유자 주소:', deployer.address);
    
    // 컨트랙트 기본 정보 확인
    const name = await jejuBadgeNFT.name();
    const symbol = await jejuBadgeNFT.symbol();
    const totalSupply = await jejuBadgeNFT.totalSupply();
    
    console.log('\n📋 컨트랙트 정보:');
    console.log('- 이름:', name);
    console.log('- 심볼:', symbol);
    console.log('- 총 발행량:', totalSupply.toString());
    
    // 환경변수 파일 업데이트 정보 출력
    console.log('\n🔧 환경변수 설정:');
    console.log('다음 정보를 .env 파일에 추가하세요:');
    console.log('');
    console.log(`NFT_CONTRACT_ADDRESS=${contractAddress}`);
    console.log(`DEPLOYER_ADDRESS=${deployer.address}`);
    console.log(`DEPLOYMENT_NETWORK=${network.name}`);
    console.log(`DEPLOYMENT_CHAIN_ID=${network.chainId.toString()}`);
    
    // 블록체인 익스플로러 링크
    let explorerUrl = '';
    switch (network.chainId.toString()) {
      case '80002': // Polygon Amoy Testnet
        explorerUrl = `https://amoy.polygonscan.com/address/${contractAddress}`;
        break;
      case '11155111': // Sepolia Testnet
        explorerUrl = `https://sepolia.etherscan.io/address/${contractAddress}`;
        break;
      case '1337': // Local
        explorerUrl = 'Local network - No explorer';
        break;
      default:
        explorerUrl = `Chain ID ${network.chainId} - Unknown explorer`;
    }
    
    console.log('\n🔍 블록체인 익스플로러:');
    console.log(explorerUrl);
    
    // 테스트 배지 발행 (선택사항)
    if (process.env.MINT_TEST_BADGE === 'true') {
      console.log('\n🎯 테스트 배지 발행 중...');
      
      const testBadgeTx = await jejuBadgeNFT.mintBadge(
        deployer.address,
        "테스트 배지",
        "컨트랙트 배포 기념 테스트 배지",
        "제주도 테스트 위치",
        0, // bronze
        "33.3617,126.5312",
        "data:application/json;base64,eyJ0ZXN0IjoidHJ1ZSJ9"
      );
      
      await testBadgeTx.wait();
      console.log('✅ 테스트 배지 발행 완료!');
      console.log('📄 트랜잭션:', testBadgeTx.hash);
      
      const newTotalSupply = await jejuBadgeNFT.totalSupply();
      console.log('📊 새로운 총 발행량:', newTotalSupply.toString());
    }
    
    console.log('\n🎉 배포 작업 완료!');
    
  } catch (error) {
    console.error('❌ 배포 실패:', error.message);
    
    // 일반적인 오류 해결 방법 안내
    if (error.message.includes('insufficient funds')) {
      console.log('\n💡 해결 방법:');
      console.log('1. 테스트넷 토큰을 받으세요:');
      console.log('   - Polygon Amoy: https://faucet.polygon.technology/');
      console.log('   - Sepolia: https://sepoliafaucet.com/');
    } else if (error.message.includes('network')) {
      console.log('\n💡 해결 방법:');
      console.log('1. 네트워크 연결을 확인하세요');
      console.log('2. RPC URL이 올바른지 확인하세요');
      console.log('3. .env 파일의 설정을 확인하세요');
    }
    
    process.exit(1);
  }
}

// 배포 스크립트 실행
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ 예상치 못한 오류:', error);
    process.exit(1);
  });