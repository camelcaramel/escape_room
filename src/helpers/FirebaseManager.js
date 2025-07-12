// src/helpers/FirebaseManager.js
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
} from "firebase/firestore";

// 1단계에서 복사한 firebaseConfig 객체를 여기에 붙여넣으세요.
const firebaseConfig = {
  apiKey: "AIzaSyB5v_i48cvrlI_toBp4wwbxjgmGr3J2p-o",
  authDomain: "safety-d8f49.firebaseapp.com",
  projectId: "safety-d8f49",
  storageBucket: "safety-d8f49.firebasestorage.app",
  messagingSenderId: "872201261251",
  appId: "1:872201261251:web:268f78cd4586aa854d5276",
  measurementId: "G-6DM6YV879V",
};
// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);
// Firestore 인스턴스 가져오기
const db = getFirestore(app);
// 'rankings' 컬렉션에 대한 참조 생성
const rankingsCollection = collection(db, "rankings");

/**
 * 게임 클리어 기록을 Firestore에 저장하는 함수
 * @param {string} playerName - 플레이어 닉네임
 * @param {string} playerClass - 플레이어 학급
 * @param {number} completionTime - 클리어 시간 (초)
 */
export async function saveScore(playerName, playerClass, completionTime) {
  try {
    const docRef = await addDoc(rankingsCollection, {
      name: playerName,
      class: playerClass,
      time: completionTime,
      createdAt: new Date(), // 기록된 시간
    });
    console.log("점수 저장 성공! Document ID: ", docRef.id);
    return true;
  } catch (e) {
    console.error("점수 저장 중 오류 발생: ", e);
    return false;
  }
}

/**
 * Firestore에서 순위 기록을 가져오는 함수
 * @returns {Promise<Array>} 순위 데이터 배열
 */
export async function getRankings() {
  // 'time' 필드를 기준으로 오름차순 정렬하고 상위 100개만 가져오는 쿼리
  const q = query(rankingsCollection, orderBy("time", "asc"), limit(100));

  try {
    const querySnapshot = await getDocs(q);
    const rankings = [];
    querySnapshot.forEach((doc) => {
      rankings.push(doc.data());
    });
    console.log("순위 불러오기 성공!");
    return rankings;
  } catch (e) {
    console.error("순위 불러오기 중 오류 발생: ", e);
    return [];
  }
}
