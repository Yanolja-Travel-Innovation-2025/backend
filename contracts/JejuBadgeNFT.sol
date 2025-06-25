// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title JejuBadgeNFT
 * @dev 제주도 디지털 관광 여권 배지 NFT 컨트랙트
 * 관광지 방문 시 발급되는 배지를 NFT로 관리
 */
contract JejuBadgeNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;
    
    // 배지 등급 열거형
    enum BadgeRarity { BRONZE, SILVER, GOLD }
    
    // 배지 정보 구조체
    struct Badge {
        string name;                // 배지 이름
        string description;         // 배지 설명
        string location;            // 관광지 위치
        BadgeRarity rarity;         // 배지 등급
        uint256 timestamp;          // 발급 시간
        string coordinates;         // GPS 좌표
    }
    
    // 토큰 ID => 배지 정보 매핑
    mapping(uint256 => Badge) public badges;
    
    // 사용자 => 배지별 보유 여부 매핑 (중복 발급 방지)
    mapping(address => mapping(string => bool)) public userHasBadge;
    
    // 배지별 발급 총 개수
    mapping(string => uint256) public badgeCount;
    
    // 이벤트 정의
    event BadgeMinted(
        address indexed to,
        uint256 indexed tokenId,
        string badgeName,
        string location,
        BadgeRarity rarity
    );
    
    constructor(address initialOwner) ERC721("Jeju Digital Passport Badge", "JEJUBADGE") Ownable(initialOwner) {}
    
    /**
     * @dev 배지 NFT 발행
     * @param to 배지를 받을 주소
     * @param badgeName 배지 이름
     * @param description 배지 설명
     * @param location 관광지 위치
     * @param rarity 배지 등급
     * @param coordinates GPS 좌표
     * @param uri 메타데이터 URI (IPFS)
     */
    function mintBadge(
        address to,
        string memory badgeName,
        string memory description,
        string memory location,
        BadgeRarity rarity,
        string memory coordinates,
        string memory uri
    ) public onlyOwner {
        // 중복 발급 방지 체크
        require(!userHasBadge[to][badgeName], "User already has this badge");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        // NFT 발행
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        // 배지 정보 저장
        badges[tokenId] = Badge({
            name: badgeName,
            description: description,
            location: location,
            rarity: rarity,
            timestamp: block.timestamp,
            coordinates: coordinates
        });
        
        // 사용자 배지 보유 표시
        userHasBadge[to][badgeName] = true;
        
        // 배지 발급 개수 증가
        badgeCount[badgeName]++;
        
        emit BadgeMinted(to, tokenId, badgeName, location, rarity);
    }
    
    /**
     * @dev 사용자가 특정 배지를 보유하고 있는지 확인
     * @param user 사용자 주소
     * @param badgeName 배지 이름
     */
    function hasBadge(address user, string memory badgeName) public view returns (bool) {
        return userHasBadge[user][badgeName];
    }
    
    /**
     * @dev 사용자의 모든 배지 토큰 ID 조회
     * @param user 사용자 주소
     */
    function getUserBadges(address user) public view returns (uint256[] memory) {
        uint256 userBalance = balanceOf(user);
        uint256[] memory userTokens = new uint256[](userBalance);
        uint256 currentIndex = 0;
        
        uint256 total = _tokenIdCounter;
        
        for (uint256 i = 0; i < total; i++) {
            if (ownerOf(i) == user) {
                userTokens[currentIndex] = i;
                currentIndex++;
            }
        }
        
        return userTokens;
    }
    
    /**
     * @dev 배지 등급별 개수 조회
     * @param user 사용자 주소
     */
    function getBadgeCountByRarity(address user) public view returns (uint256, uint256, uint256) {
        uint256[] memory userTokens = getUserBadges(user);
        uint256 bronzeCount = 0;
        uint256 silverCount = 0;
        uint256 goldCount = 0;
        
        for (uint256 i = 0; i < userTokens.length; i++) {
            BadgeRarity rarity = badges[userTokens[i]].rarity;
            if (rarity == BadgeRarity.BRONZE) bronzeCount++;
            else if (rarity == BadgeRarity.SILVER) silverCount++;
            else if (rarity == BadgeRarity.GOLD) goldCount++;
        }
        
        return (bronzeCount, silverCount, goldCount);
    }
    
    /**
     * @dev 전체 발행된 토큰 수 조회
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter;
    }
    
    // 필수 오버라이드 함수들
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}