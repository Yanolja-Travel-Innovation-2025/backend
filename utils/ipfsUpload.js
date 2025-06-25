/**
 * IPFS 메타데이터 업로드 유틸리티 (Pinata 서비스 사용)
 */

const axios = require('axios');
const FormData = require('form-data');

/**
 * Pinata API를 통해 JSON 메타데이터를 IPFS에 업로드
 * @param {Object} metadata NFT 메타데이터 객체
 * @param {string} fileName 파일명
 * @returns {Promise<string>} IPFS 해시
 */
async function uploadMetadataToIPFS(metadata, fileName) {
  try {
    const pinataApiKey = process.env.PINATA_API_KEY;
    const pinataSecretApiKey = process.env.PINATA_SECRET_API_KEY;

    if (!pinataApiKey || !pinataSecretApiKey) {
      throw new Error('Pinata API keys not configured');
    }

    const data = JSON.stringify({
      pinataOptions: {
        cidVersion: 1
      },
      pinataMetadata: {
        name: fileName,
        keyvalues: {
          project: "jeju-digital-passport",
          type: "nft-metadata"
        }
      },
      pinataContent: metadata
    });

    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      data,
      {
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': pinataApiKey,
          'pinata_secret_api_key': pinataSecretApiKey
        }
      }
    );

    return response.data.IpfsHash;
  } catch (error) {
    console.error('IPFS 업로드 실패:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * 이미지 파일을 IPFS에 업로드
 * @param {Buffer} imageBuffer 이미지 파일 버퍼
 * @param {string} fileName 파일명
 * @returns {Promise<string>} IPFS 해시
 */
async function uploadImageToIPFS(imageBuffer, fileName) {
  try {
    const pinataApiKey = process.env.PINATA_API_KEY;
    const pinataSecretApiKey = process.env.PINATA_SECRET_API_KEY;

    if (!pinataApiKey || !pinataSecretApiKey) {
      throw new Error('Pinata API keys not configured');
    }

    const formData = new FormData();
    formData.append('file', imageBuffer, fileName);

    const metadata = JSON.stringify({
      name: fileName,
      keyvalues: {
        project: "jeju-digital-passport",
        type: "badge-image"
      }
    });
    formData.append('pinataMetadata', metadata);

    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'pinata_api_key': pinataApiKey,
          'pinata_secret_api_key': pinataSecretApiKey
        }
      }
    );

    return response.data.IpfsHash;
  } catch (error) {
    console.error('이미지 IPFS 업로드 실패:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * IPFS 해시로부터 공개 URL 생성
 * @param {string} ipfsHash IPFS 해시
 * @returns {string} 공개 접근 가능한 URL
 */
function getIPFSUrl(ipfsHash) {
  // Pinata Gateway 사용 (더 안정적)
  return `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
  
  // 또는 공개 게이트웨이 사용
  // return `https://ipfs.io/ipfs/${ipfsHash}`;
}

/**
 * 메타데이터와 이미지를 함께 IPFS에 업로드
 * @param {Object} badgeData 배지 데이터
 * @param {Buffer} imageBuffer 배지 이미지 버퍼
 * @returns {Promise<Object>} 업로드 결과
 */
async function uploadBadgeToIPFS(badgeData, imageBuffer) {
  try {
    // 1. 이미지 먼저 업로드
    const imageFileName = `${badgeData.name.replace(/\s+/g, '_')}_${badgeData.rarity}.png`;
    const imageHash = await uploadImageToIPFS(imageBuffer, imageFileName);
    const imageUrl = getIPFSUrl(imageHash);

    // 2. 이미지 URL을 포함한 메타데이터 생성
    const { createNFTMetadata } = require('./nftMetadata');
    const metadata = createNFTMetadata({
      ...badgeData,
      imageUrl: imageUrl
    });

    // 3. 메타데이터 업로드
    const metadataFileName = `${badgeData.name.replace(/\s+/g, '_')}_metadata.json`;
    const metadataHash = await uploadMetadataToIPFS(metadata, metadataFileName);
    const metadataUrl = getIPFSUrl(metadataHash);

    return {
      imageHash,
      imageUrl,
      metadataHash,
      metadataUrl,
      metadata
    };
  } catch (error) {
    console.error('배지 IPFS 업로드 실패:', error);
    throw error;
  }
}

/**
 * 임시로 로컬 URL 사용 (개발/테스트용)
 * @param {Object} badgeData 배지 데이터
 * @returns {Object} 로컬 URL을 포함한 메타데이터
 */
function createLocalMetadata(badgeData) {
  const { createNFTMetadata, generateBadgeImageUrl } = require('./nftMetadata');
  
  const imageUrl = generateBadgeImageUrl(badgeData.name, badgeData.rarity);
  const metadata = createNFTMetadata({
    ...badgeData,
    imageUrl: imageUrl
  });

  return {
    metadata,
    metadataUrl: `data:application/json;base64,${Buffer.from(JSON.stringify(metadata)).toString('base64')}`
  };
}

module.exports = {
  uploadMetadataToIPFS,
  uploadImageToIPFS,
  getIPFSUrl,
  uploadBadgeToIPFS,
  createLocalMetadata
};