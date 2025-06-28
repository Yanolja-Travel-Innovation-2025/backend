const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('JejuBadgeNFT', function () {
  let jejuBadgeNFT;
  let owner, user1, user2;
  
  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    const JejuBadgeNFT = await ethers.getContractFactory('JejuBadgeNFT');
    jejuBadgeNFT = await JejuBadgeNFT.deploy(owner.address);
    await jejuBadgeNFT.waitForDeployment();
  });

  describe('배포', function () {
    it('올바른 이름과 심볼로 배포되어야 함', async function () {
      expect(await jejuBadgeNFT.name()).to.equal('Jeju Digital Passport Badge');
      expect(await jejuBadgeNFT.symbol()).to.equal('JEJUBADGE');
    });

    it('소유자가 올바르게 설정되어야 함', async function () {
      expect(await jejuBadgeNFT.owner()).to.equal(owner.address);
    });

    it('초기 총 발행량이 0이어야 함', async function () {
      expect(await jejuBadgeNFT.totalSupply()).to.equal(0);
    });
  });

  describe('배지 발행', function () {
    it('소유자가 배지를 발행할 수 있어야 함', async function () {
      await jejuBadgeNFT.mintBadge(
        user1.address,
        '한라산 정상 탐험가',
        '제주도의 최고봉 한라산 정상을 정복한 용감한 탐험가',
        '한라산 백록담',
        2, // GOLD
        '33.3617,126.5312',
        'ipfs://test-metadata'
      );

      expect(await jejuBadgeNFT.balanceOf(user1.address)).to.equal(1);
      expect(await jejuBadgeNFT.totalSupply()).to.equal(1);
    });

    it('소유자가 아닌 계정은 배지를 발행할 수 없어야 함', async function () {
      await expect(
        jejuBadgeNFT.connect(user1).mintBadge(
          user2.address,
          '테스트 배지',
          '테스트 설명',
          '테스트 위치',
          0,
          '0,0',
          'ipfs://test'
        )
      ).to.be.revertedWithCustomError(jejuBadgeNFT, 'OwnableUnauthorizedAccount');
    });

    it('중복 배지 발행이 방지되어야 함', async function () {
      // 첫 번째 배지 발행
      await jejuBadgeNFT.mintBadge(
        user1.address,
        '한라산 정상 탐험가',
        '설명',
        '위치',
        2,
        '0,0',
        'ipfs://test'
      );

      // 같은 배지 중복 발행 시도
      await expect(
        jejuBadgeNFT.mintBadge(
          user1.address,
          '한라산 정상 탐험가',
          '설명',
          '위치',
          2,
          '0,0',
          'ipfs://test'
        )
      ).to.be.revertedWith('User already has this badge');
    });
  });

  describe('배지 조회', function () {
    beforeEach(async function () {
      // 테스트용 배지들 발행
      await jejuBadgeNFT.mintBadge(
        user1.address,
        '한라산 정상 탐험가',
        '제주도의 최고봉',
        '한라산',
        2, // GOLD
        '33.3617,126.5312',
        'ipfs://gold-badge'
      );

      await jejuBadgeNFT.mintBadge(
        user1.address,
        '성산일출봉 감상가',
        '아름다운 일출',
        '성산일출봉',
        1, // SILVER
        '33.4584,126.9423',
        'ipfs://silver-badge'
      );

      await jejuBadgeNFT.mintBadge(
        user2.address,
        '협재해수욕장 방문자',
        '에메랄드빛 바다',
        '협재해수욕장',
        0, // BRONZE
        '33.3939,126.2394',
        'ipfs://bronze-badge'
      );
    });

    it('사용자의 배지 목록을 올바르게 반환해야 함', async function () {
      const user1Badges = await jejuBadgeNFT.getUserBadges(user1.address);
      const user2Badges = await jejuBadgeNFT.getUserBadges(user2.address);

      expect(user1Badges.length).to.equal(2);
      expect(user2Badges.length).to.equal(1);
    });

    it('배지 등급별 개수를 올바르게 계산해야 함', async function () {
      const user1Stats = await jejuBadgeNFT.getBadgeCountByRarity(user1.address);
      const user2Stats = await jejuBadgeNFT.getBadgeCountByRarity(user2.address);

      // user1: bronze=0, silver=1, gold=1
      expect(user1Stats[0]).to.equal(0); // bronze
      expect(user1Stats[1]).to.equal(1); // silver
      expect(user1Stats[2]).to.equal(1); // gold

      // user2: bronze=1, silver=0, gold=0
      expect(user2Stats[0]).to.equal(1); // bronze
      expect(user2Stats[1]).to.equal(0); // silver
      expect(user2Stats[2]).to.equal(0); // gold
    });

    it('배지 보유 여부를 올바르게 확인해야 함', async function () {
      expect(await jejuBadgeNFT.hasBadge(user1.address, '한라산 정상 탐험가')).to.be.true;
      expect(await jejuBadgeNFT.hasBadge(user1.address, '협재해수욕장 방문자')).to.be.false;
      expect(await jejuBadgeNFT.hasBadge(user2.address, '협재해수욕장 방문자')).to.be.true;
    });

    it('배지 정보를 올바르게 저장해야 함', async function () {
      const badge = await jejuBadgeNFT.badges(0);
      
      expect(badge.name).to.equal('한라산 정상 탐험가');
      expect(badge.description).to.equal('제주도의 최고봉');
      expect(badge.location).to.equal('한라산');
      expect(badge.rarity).to.equal(2);
      expect(badge.coordinates).to.equal('33.3617,126.5312');
    });
  });

  describe('전체 통계', function () {
    it('총 발행량이 올바르게 증가해야 함', async function () {
      expect(await jejuBadgeNFT.totalSupply()).to.equal(0);

      await jejuBadgeNFT.mintBadge(user1.address, '배지1', '설명1', '위치1', 0, '0,0', 'ipfs://1');
      expect(await jejuBadgeNFT.totalSupply()).to.equal(1);

      await jejuBadgeNFT.mintBadge(user2.address, '배지2', '설명2', '위치2', 1, '0,0', 'ipfs://2');
      expect(await jejuBadgeNFT.totalSupply()).to.equal(2);
    });
  });
});