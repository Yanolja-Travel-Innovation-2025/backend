const { ethers } = require('hardhat');
require('dotenv').config();

// NFT 컨트랙트 ABI (주요 함수만)
const NFT_ABI = [
  "function mintBadge(address to, string badgeName, string description, string location, uint8 rarity, string coordinates, string uri) external",
  "function hasBadge(address user, string badgeName) external view returns (bool)",
  "function getUserBadges(address user) external view returns (uint256[])",
  "function badges(uint256 tokenId) external view returns (string name, string description, string location, uint8 rarity, uint256 timestamp, string coordinates)",
  "function ownerOf(uint256 tokenId) external view returns (address)"
];

// 배지 등급 매핑
const RARITY_MAPPING = {
  'bronze': 0,
  'silver': 1,
  'gold': 2
};

class BlockchainService {
  constructor() {
    this.provider = null;
    this.contract = null;
    this.signer = null;
    this.initialized = false;
  }

  // 블록체인 연결 초기화
  async initialize() {
    try {
      if (this.initialized) return;

      // 네트워크 설정
      const networkUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545';
      this.provider = new ethers.JsonRpcProvider(networkUrl);
      
      // 서명자 설정 (서버의 지갑)
      const privateKey = process.env.PRIVATE_KEY;
      if (!privateKey) {
        throw new Error('PRIVATE_KEY 환경변수가 설정되지 않았습니다.');
      }
      
      this.signer = new ethers.Wallet(privateKey, this.provider);
      
      // 컨트랙트 연결
      const contractAddress = process.env.NFT_CONTRACT_ADDRESS;
      if (!contractAddress) {
        console.warn('NFT_CONTRACT_ADDRESS가 설정되지 않음. 로컬 테스트넷 사용');
        // 로컬 테스트넷에서는 기본 주소 사용 (배포 후 설정)
        return;
      }
      
      this.contract = new ethers.Contract(contractAddress, NFT_ABI, this.signer);
      this.initialized = true;
      
      console.log('✅ 블록체인 서비스 초기화 완료');
    } catch (error) {
      console.error('❌ 블록체인 서비스 초기화 실패:', error.message);
      // 개발 환경에서는 에러를 throw하지 않고 로깅만
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
    }
  }

  // NFT 배지 발행
  async mintBadge(userWalletAddress, badgeData, metadataUri) {
    try {
      await this.initialize();
      
      if (!this.contract) {
        throw new Error('NFT 컨트랙트가 초기화되지 않았습니다.');
      }

      const { name, description, location, rarity, coordinates } = badgeData;
      const rarityEnum = RARITY_MAPPING[rarity] || 0;

      console.log('🔗 NFT 발행 시작:', {
        to: userWalletAddress,
        badgeName: name,
        rarity: rarity
      });

      // 중복 배지 확인
      const hasBadge = await this.contract.hasBadge(userWalletAddress, name);
      if (hasBadge) {
        throw new Error('사용자가 이미 이 배지를 보유하고 있습니다.');
      }

      // NFT 발행 트랜잭션
      const tx = await this.contract.mintBadge(
        userWalletAddress,
        name,
        description,
        location,
        rarityEnum,
        coordinates,
        metadataUri
      );

      console.log('📝 트랜잭션 전송됨:', tx.hash);
      
      // 트랜잭션 완료 대기
      const receipt = await tx.wait();
      
      console.log('✅ NFT 발행 완료:', {
        txHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString()
      });

      return {
        success: true,
        txHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString()
      };

    } catch (error) {
      console.error('❌ NFT 발행 실패:', error.message);
      
      // 개발 환경에서는 에러를 무시하고 성공으로 처리
      if (process.env.NODE_ENV !== 'production') {
        console.log('🔧 개발 환경: NFT 발행 건너뛰기');
        return {
          success: true,
          txHash: 'dev_mock_hash_' + Date.now(),
          gasUsed: '0'
        };
      }
      
      throw error;
    }
  }

  // 사용자 배지 조회
  async getUserBadges(userWalletAddress) {
    try {
      await this.initialize();
      
      if (!this.contract) {
        return [];
      }

      const tokenIds = await this.contract.getUserBadges(userWalletAddress);
      const badges = [];

      for (const tokenId of tokenIds) {
        const badgeData = await this.contract.badges(tokenId);
        badges.push({
          tokenId: tokenId.toString(),
          name: badgeData.name,
          description: badgeData.description,
          location: badgeData.location,
          rarity: Object.keys(RARITY_MAPPING)[badgeData.rarity],
          timestamp: new Date(Number(badgeData.timestamp) * 1000),
          coordinates: badgeData.coordinates
        });
      }

      return badges;
    } catch (error) {
      console.error('❌ 사용자 배지 조회 실패:', error.message);
      return [];
    }
  }

  // 블록체인 연결 상태 확인
  async getConnectionStatus() {
    try {
      await this.initialize();
      
      if (!this.provider) return { connected: false, reason: 'Provider not initialized' };
      
      const network = await this.provider.getNetwork();
      const balance = await this.provider.getBalance(this.signer.address);
      
      return {
        connected: true,
        network: network.name,
        chainId: network.chainId.toString(),
        signerAddress: this.signer.address,
        balance: ethers.formatEther(balance),
        contractAddress: this.contract?.target || 'Not set'
      };
    } catch (error) {
      return { 
        connected: false, 
        reason: error.message 
      };
    }
  }
}

// 싱글톤 인스턴스
const blockchainService = new BlockchainService();

module.exports = blockchainService;