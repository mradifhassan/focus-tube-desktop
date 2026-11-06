#!/usr/bin/env node
/**
 * Add new math playlists to FocusTube catalog-onnorokom.js
 * Adds: Probability, Measures of Dispersion, Trigonometry, Linear Programming, Modulus
 */

const fs = require('fs');
const path = './renderer/src/data/catalog-onnorokom.js';

let content = fs.readFileSync(path, 'utf8');

// ---------- New video entries ----------
const newVideos = [
  // Probability playlist videos (15)
  {id:'Y1E14kvsbcU', title:'01. General Discussion on Probability | সম্ভাবনার সাধারণ আলোচনা | OnnoRokom Pathshala', duration:'19:31', desc:'Video Title: OnnoRokom Pathshala_Higher Mathematics\\nLecture: General Discussion on Probability\\nSubject: Math\\nTopic: Probability\\nClass: HSC 2nd Year\\nLectured by: Rasel vai'},
  {id:'pOZX7iyimhU', title:'02. Formation of Sample Space | নমুনা ক্ষেত্র তৈরী | OnnoRokom Pathshala', duration:'8:47', desc:'Video Title: OnnoRokom Pathshala_Higher Mathematics\\nLecture: Formation of Sample Space\\nSubject: Math\\nTopic: Probability\\nClass: HSC 2nd Year\\nLectured by: Rasel vai'},
  {id:'NW8ceI8kjbs', title:'03. Simple problems related to calculations | গণনা সংক্রান্ত সহজ সমস্যা | OnnoRokom Pathshala', duration:'6:05', desc:'Video Title: OnnoRokom Pathshala_Higher Mathematics\\nLecture: Simple problems related to calculations\\nSubject: Math\\nTopic: Probability\\nClass: HSC 2nd Year\\nLectured by: Rasel vai'},
  {id:'HNevvIfV3cc', title:'04. Addition rule of probabilities | সম্ভাব্যতার সংযোগ সূত্র | OnnoRokom Pathshala', duration:'15:20', desc:'Video Title: OnnoRokom Pathshala_Higher Mathematics\\nLecture: Addition rule of probabilities\\nSubject: Math\\nTopic: Probability\\nClass: HSC 2nd Year\\nLectured by: Rasel vai'},
  {id:'_9vTRjgocP0', title:'05. The concept of complementary events | সম্পূরকের ধারণ | OnnoRokom Pathshala', duration:'15:45', desc:'Video Title: OnnoRokom Pathshala_Higher Mathematics\\nLecture: The concept of complementary events\\nSubject: Math\\nTopic: Probability\\nClass: HSC 2nd Year\\nLectured by: Rasel vai'},
  {id:'02XiBx5VHUU', title:'06. Probabilities regarding numbers | সংখ্যা সংক্রান্ত সম্ভাব্যতা | OnnoRokom Pathshala', duration:'9:59', desc:'Video Title: OnnoRokom Pathshala_Higher Mathematics\\nLecture: Probabilities regarding numbers\\nSubject: Math\\nTopic: Probability\\nClass: HSC 2nd Year\\nLectured by: Rasel vai'},
  {id:'dVeIP7Nz-PQ', title:'07. Probabilities regarding series | সিরিজ সংক্রান্ত সম্ভাব্যতা | OnnoRokom Pathshala', duration:'9:44', desc:'Video Title: OnnoRokom Pathshala_Higher Mathematics\\nLecture: Probabilities regarding series\\nSubject: Math\\nTopic: Probability\\nClass: HSC 2nd Year\\nLectured by: Rasel vai'},
  {id:'xXmfsar-zJ8', title:'08. Binomial Distribution | বাইনোমিআল ডিসট্রিবিউশন | OnnoRokom Pathshala', duration:'13:09', desc:'Video Title: OnnoRokom Pathshala_Higher Mathematics\\nLecture: Binomial Distribution\\nSubject: Math\\nTopic: Probability\\nClass: HSC 2nd Year\\nLectured by: Rasel vai'},
  {id:'IPdD2eInrAs', title:'09. Problems related to cards | কার্ড সংক্রান্ত সমস্যা | OnnoRokom Pathshala', duration:'14:21', desc:'Video Title: OnnoRokom Pathshala_Higher Mathematics\\nLecture: Problems related to cards\\nSubject: Math\\nTopic: Probability\\nClass: HSC 2nd Year\\nLectured by: Rasel vai'},
  {id:'QM1uKmzudAw', title:'10. Conditional probability | শর্তাধীন সম্ভাব্যতা | OnnoRokom Pathshala', duration:'11:17', desc:'Video Title: OnnoRokom Pathshala_Higher Mathematics\\nLecture: Conditional probability\\nSubject: Math\\nTopic: Probability\\nClass: HSC 2nd Year\\nLectured by: Rasel vai'},
  {id:'rszcKgvA0jU', title:'11. Random examples Part 01 | রেনডম উদাহরণ পর্ব ০১ | OnnoRokom Pathshala', duration:'18:13', desc:'Video Title: OnnoRokom Pathshala_Higher Mathematics\\nLecture: Random examples Part 01\\nSubject: Math\\nTopic: Probability\\nClass: HSC 2nd Year\\nLectured by: Rasel vai'},
  {id:'__WfAZT_G5s', title:'11. Random examples Part 02 | রেনডম উদাহরণ পর্ব ০২ | OnnoRokom Pathshala', duration:'12:55', desc:'Video Title: OnnoRokom Pathshala_Higher Mathematics\\nLecture: Random examples Part 02\\nSubject: Math\\nTopic: Probability\\nClass: HSC 2nd Year\\nLectured by: Rasel vai'},
  {id:'kziYkArx99s', title:'12. A famous problem Part 01 | বিখ্যাত সমস্যা পর্ব ০১ | OnnoRokom Pathshala', duration:'10:55', desc:'Video Title: OnnoRokom Pathshala_Higher Mathematics\\nLecture: A famous problem Part 01\\nSubject: Math\\nTopic: Probability\\nClass: HSC 2nd Year\\nLectured by: Rasel vai'},
  {id:'HJw46kvy-Ik', title:'12. A famous problem Part 02 | বিখ্যাত সমস্যা পর্ব ০২ | OnnoRokom Pathshala', duration:'14:33', desc:'Video Title: OnnoRokom Pathshala_Higher Mathematics\\nLecture: A famous problem Part 02\\nSubject: Math\\nTopic: Probability\\nClass: HSC 2nd Year\\nLectured by: Rasel vai'},
  {id:'hSbw629Ry40', title:'13. Applications of the theory of probability in real life | বাস্তব জীবনে সম্ভাবনার প্রয়োগ | OnnoRokom Pathshala', duration:'10:29', desc:'Video Title: OnnoRokom Pathshala_Higher Mathematics\\nLecture: Applications of the theory of probability in real life\\nSubject: Math\\nTopic: Probability\\nClass: HSC 2nd Year\\nLectured by: Rasel vai'},
  // Measures of Dispersion (13)
  {id:'L6ZmbdpEjic', title:'01. Mean | গড় | OnnoRokom Pathshala', duration:'5:00', desc:'Video Title: OnnoRokom Pathshala_Higher Mathematics\\nLecture: Mean\\nSubject: Math\\nTopic: Measure of Dispersion\\nClass: HSC\\nLectured by: OnnoRokom Pathshala'},
  {id:'BLnYi_bTNm0', title:'02. Median | মধ্যক | OnnoRokom Pathshala', duration:'8:44', desc:'Video Title: OnnoRokom Pathshala_Higher Mathematics\\nLecture: Median\\nSubject: Math\\nTopic: Measure of Dispersion\\nClass: HSC\\nLectured by: OnnoRokom Pathshala'},
  {id:'IYxSMiyqz94', title:'03. Mode | প্রচুরক | OnnoRokom Pathshala', duration:'4:46', desc:'Video Title: OnnoRokom Pathshala_Higher Mathematics\\nLecture: Mode\\nSubject: Math\\nTopic: Measure of Dispersion\\nClass: HSC\\nLectured by: OnnoRokom Pathshala'},
  {id:'J84zZfcrVak', title:'04. Concept of Measure of Dispersion | বিস্তার-পরিমাপের ধারণা | OnnoRokom Pathshala', duration:'2:12', desc:'Video Title: OnnoRokom Pathshala_Higher Mathematics\\nLecture: Concept of Measure of Dispersion\\nSubject: Math\\nTopic: Measure of Dispersion\\nClass: HSC\\nLectured by: OnnoRokom Pathshala'},
  {id:'2fKam8Ux87g', title:'05. Range & Co-efficient of Range | পরিসর এবং পরিসরাঙ্ক | OnnoRokom Pathshala', duration:'4:02', desc:'Video Title: OnnoRokom Pathshala_Higher Mathematics\\nLecture: Range & Co-efficient of Range\\nSubject: Math\\nTopic: Measure of Dispersion\\nClass: HSC\\nLectured by: OnnoRokom Pathshala'},
  {id:'g2sOV-LNDQQ', title:'06. চতুর্থক ব্যবধান ও চতুর্থক ব্যবধানাঙ্ক এর ধারণা | OnnoRokom Pathshala', duration:'8:17', desc:'Video Title: OnnoRokom Pathshala_Higher Mathematics\\nLecture: Quartile Deviation and its Coefficient\\nSubject: Math\\nTopic: Measure of Dispersion\\nClass: HSC\\nLectured by: OnnoRokom Pathshala'},
  {id:'vayiusfGVgQ', title:'07. চতুর্থক ব্যবধান ও চতুর্থক ব্যবধানাঙ্ক সম্পর্কিত সমস্যা | OnnoRokom Pathshala', duration:'14:10', desc:'Video Title: OnnoRokom Pathshala_Higher Mathematics\\nLecture: Problems on Quartile Deviation\\nSubject: Math\\nTopic: Measure of Dispersion\\nClass: HSC\\nLectured by: OnnoRokom Pathshala'},
  {id:'DQG1c5HoaKw', title:'08. গড় ব্যবধান, পরিমিত ব্যবধান, ভেদাঙ্ক এবং বিভেদাঙ্ক এর ধারণা | OnnoRokom Pathshala', duration:'12:01', desc:'Video Title: OnnoRokom Pathshala_Higher Mathematics\\nLecture: Mean Deviation, Standard Deviation, Variance and Coefficient of Variation\\nSubject: Math\\nTopic: Measure of Dispersion\\nClass: HSC\\nLectured by: OnnoRokom Pathshala'},
  {id:'CJxL3NsTE24', title:'09. Equation of Variance | ভেদাঙ্ক এর সমীকরণ | OnnoRokom Pathshala', duration:'4:12', desc:'Video Title: OnnoRokom Pathshala_Higher Mathematics\\nLecture: Equation of Variance\\nSubject: Math\\nTopic: Measure of Dispersion\\nClass: HSC\\nLectured by: OnnoRokom Pathshala'},
  {id:'OQnlcwqV_hw', title:'10. Problem of Mean Deviation and Co-efficient of Mean Deviation | OnnoRokom Pathshala', duration:'9:29', desc:'Video Title: OnnoRokom Pathshala_Higher Mathematics\\nLecture: Problems on Mean Deviation\\nSubject: Math\\nTopic: Measure of Dispersion\\nClass: HSC\\nLectured by: OnnoRokom Pathshala'},
  {id:'uRz3Rxd4gOA', title:'11. পরিমিত ব্যবধান, ভেদাঙ্ক এবং বিভেদাঙ্ক সম্পর্কিত সমস্যা | OnnoRokom Pathshala', duration:'15:16', desc:'Video Title: OnnoRokom Pathshala_Higher Mathematics\\nLecture: Problems on Standard Deviation, Variance and Coefficient\\nSubject: Math\\nTopic: Measure of Dispersion\\nClass: HSC\\nLectured by: OnnoRokom Pathshala'},
  {id:'2CVv0c6-G04', title:'12. গড় ব্যবধান এবং পরিমিত ব্যবধান সম্পর্কিত মিশ্র সমস্যা | OnnoRokom Pathshala', duration:'11:32', desc:'Video Title: OnnoRokom Pathshala_Higher Mathematics\\nLecture: Mixed Problems on Mean Deviation and Standard Deviation\\nSubject: Math\\nTopic: Measure of Dispersion\\nClass: HSC\\nLectured by: OnnoRokom Pathshala'},
  {id:'7v5DdYgVyPo', title:'13. Application of Co-efficient of Variance | বিভেদাঙ্ক এর ব্যবহার | OnnoRokom Pathshala', duration:'8:24', desc:'Video Title: OnnoRokom Pathshala_Higher Mathematics\\nLecture: Application of Coefficient of Variation\\nSubject: Math\\nTopic: Measure of Dispersion\\nClass: HSC\\nLectured by: OnnoRokom Pathshala'},
  // Trigonometry (10)
  {id:'-S6MTpVx1NA', title:'01. ত্রিকোণমিতিক সমীকরণের সাধারণ সমাধান পর্ব ০১ | OnnoRokom Pathshala', duration:'15:17', desc:'Video Title: OnnoRokom Pathshala_Higher Mathematics\\nLecture: Trigonometric Equations Part 01\\nSubject: Math\\nTopic: Trigonometry\\nClass: HSC\\nLectured by: OnnoRokom Pathshala'},
  {id:'9MBeuJHYsHI', title:'01. ত্রিকোণমিতিক সমীকরণের সাধারণ সমাধান পর্ব ০২ | OnnoRokom Pathshala', duration:'15:25', desc:'Video Title: OnnoRokom Pathshala_Higher Mathematics\\nLecture: Trigonometric Equations Part 02\\nSubject: Math\\nTopic: Trigonometry\\nClass: HSC\\nLectured by: OnnoRokom Pathshala'},
  {id:'7vTjP1kMM2k', title:'01. ত্রিকোণমিতিক সমীকরণের সাধারণ সমাধান পর্ব ০৩ | OnnoRokom Pathshala', duration:'14:31', desc:'Video Title: OnnoRokom Pathshala_Higher Mathematics\\nLecture: Trigonometric Equations Part 03\\nSubject: Math\\nTopic: Trigonometry\\nClass: HSC\\nLectured by: OnnoRokom Pathshala'},
  {id:'-f0MwA5ohO4', title:'01. ত্রিকোণমিতিক সমীকরণের সাধারণ সমাধান পর্ব ০৪ | OnnoRokom Pathshala', duration:'7:47', desc:'Video Title: OnnoRokom Pathshala_Higher Mathematics\\nLecture: Trigonometric Equations Part 04\\nSubject: Math\\nTopic: Trigonometry\\nClass: HSC\\nLectured by: OnnoRokom Pathshala'},
  {id:'Wcczdn-c50c', title:'02. Inverse Circular Function Part 01 | বিপরীত বৃত্তীয় ফাংশন পর্ব ০১ | OnnoRokom Pathshala', duration:'7:48', desc:'Video Title: OnnoRokom Pathshala_Higher Mathematics\\nLecture: Inverse Circular Function Part 01\\nSubject: Math\\nTopic: Trigonometry\\nClass: HSC\\nLectured by: OnnoRokom Pathshala'},
  {id:'G2OfNM1Cjc8', title:'02. Inverse Circular Function Part 02 | বিপরীত বৃত্তীয় ফাংশন পর্ব ০২ | OnnoRokom Pathshala', duration:'8:02', desc:'Video Title: OnnoRokom Pathshala_Higher Mathematics\\nLecture: Inverse Circular Function Part 02\\nSubject: Math\\nTopic: Trigonometry\\nClass: HSC\\nLectured by: OnnoRokom Pathshala'},
  {id:'AJqft5KUScA', title:'02. Inverse Circular Function Part 03 | বিপরীত বৃত্তীয় ফাংশন পর্ব ০৩ | OnnoRokom Pathshala', duration:'17:31', desc:'Video Title: OnnoRokom Pathshala_Higher Mathematics\\nLecture: Inverse Circular Function Part 03\\nSubject: Math\\nTopic: Trigonometry\\nClass: HSC\\nLectured by: OnnoRokom Pathshala'},
  {id:'gVBXUtHx3GQ', title:'02. Inverse Circular Function Part 04 | বিপরীত বৃত্তীয় ফাংশন পর্ব ০৪ | OnnoRokom Pathshala', duration:'8:17', desc:'Video Title: OnnoRokom Pathshala_Higher Mathematics\\nLecture: Inverse Circular Function Part 04\\nSubject: Math\\nTopic: Trigonometry\\nClass: HSC\\nLectured by: OnnoRokom Pathshala'},
  {id:'MavaHIhiZKU', title:'02. Inverse Circular Function Part 05 | বিপরীত বৃত্তীয় ফাংশন পর্ব ০৫ | OnnoRokom Pathshala', duration:'10:49', desc:'Video Title: OnnoRokom Pathshala_Higher Mathematics\\nLecture: Inverse Circular Function Part 05\\nSubject: Math\\nTopic: Trigonometry\\nClass: HSC\\nLectured by: OnnoRokom Pathshala'},
  {id:'WFP3irfLxyI', title:'02. Inverse Circular Function Part 06 | বিপরীত বৃত্তীয় ফাংশন পর্ব ০৬ | OnnoRokom Pathshala', duration:'10:40', desc:'Video Title: OnnoRokom Pathshala_Higher Mathematics\\nLecture: Inverse Circular Function Part 06\\nSubject: Math\\nTopic: Trigonometry\\nClass: HSC\\nLectured by: OnnoRokom Pathshala'},
  // Linear Programming (6)
  {id:'c_u0a4aNxhY', title:'01. Introduction to Linear Programming | যোগ্রাশ্রয়ী প্রোগ্রামের সাধারণ আলোচনা | OnnoRokom Pathshala', duration:'3:58', desc:'Video Title: OnnoRokom Pathshala_Higher Mathematics\\nLecture: Introduction to Linear Programming\\nSubject: Math\\nTopic: Linear Programming\\nClass: HSC\\nLectured by: OnnoRokom Pathshala'},
  {id:'jgdsahRFZtg', title:'02. Mathematical Problem Part 01 | গাণিতিক সমস্যা পর্ব ০১ | OnnoRokom Pathshala', duration:'31:52', desc:'Video Title: OnnoRokom Pathshala_Higher Mathematics\\nLecture: Mathematical Problem Part 01\\nSubject: Math\\nTopic: Linear Programming\\nClass: HSC\\nLectured by: OnnoRokom Pathshala'},
  {id:'BCcEddoZl0w', title:'02. Mathematical Problem Part 02 | গাণিতিক সমস্যা পর্ব ০২ | OnnoRokom Pathshala', duration:'19:15', desc:'Video Title: OnnoRokom Pathshala_Higher Mathematics\\nLecture: Mathematical Problem Part 02\\nSubject: Math\\nTopic: Linear Programming\\nClass: HSC\\nLectured by: OnnoRokom Pathshala'},
  {id:'sdqKJoZD5P4', title:'02. Mathematical Problem Part 03 | গাণিতিক সমস্যা পর্ব ০৩ | OnnoRokom Pathshala', duration:'14:34', desc:'Video Title: OnnoRokom Pathshala_Higher Mathematics\\nLecture: Mathematical Problem Part 03\\nSubject: Math\\nTopic: Linear Programming\\nClass: HSC\\nLectured by: OnnoRokom Pathshala'},
  {id:'s3oOGbJQWS4', title:'02. Mathematical Problem Part 04 | গাণিতিক সমস্যা পর্ব ০৪ | OnnoRokom Pathshala', duration:'12:23', desc:'Video Title: OnnoRokom Pathshala_Higher Mathematics\\nLecture: Mathematical Problem Part 04\\nSubject: Math\\nTopic: Linear Programming\\nClass: HSC\\nLectured by: OnnoRokom Pathshala'},
  {id:'dbEB89uXhXE', title:'02. Mathematical Problem Part 05 | গাণিতিক সমস্যা পর্ব ০৫ | OnnoRokom Pathshala', duration:'8:45', desc:'Video Title: OnnoRokom Pathshala_Higher Mathematics\\nLecture: Mathematical Problem Part 05\\nSubject: Math\\nTopic: Linear Programming\\nClass: HSC\\nLectured by: OnnoRokom Pathshala'},
  // Modulus (5)
  {id:'FKXKWUI8-L4', title:'01. Modulus | মডুলাস | OnnoRokom Pathshala', duration:'12:26', desc:'Video Title: OnnoRokom Pathshala_Higher Mathematics\\nLecture: Modulus\\nSubject: Math\\nTopic: Real Numbers\\nClass: HSC\\nLectured by: OnnoRokom Pathshala'},
  {id:'Qoy8o96Eaz0', title:'02. Solution | সমাধান | OnnoRokom Pathshala', duration:'9:35', desc:'Video Title: OnnoRokom Pathshala_Higher Mathematics\\nLecture: Solution\\nSubject: Math\\nTopic: Real Numbers\\nClass: HSC\\nLectured by: OnnoRokom Pathshala'},
  {id:'Zg7vVZvmsTU', title:'03. Some Important Problems | কিছু গুরুত্ত্বপূর্ণ অংক | OnnoRokom Pathshala', duration:'13:36', desc:'Video Title: OnnoRokom Pathshala_Higher Mathematics\\nLecture: Some Important Problems\\nSubject: Math\\nTopic: Real Numbers\\nClass: HSC\\nLectured by: OnnoRokom Pathshala'},
  {id:'pQuCu8c5n9s', title:'04. Real Number Related Axioms | বাস্তব সংখ্যা সম্পর্কিত বিধিসমূহ | OnnoRokom Pathshala', duration:'9:54', desc:'Video Title: OnnoRokom Pathshala_Higher Mathematics\\nLecture: Real Number Related Axioms\\nSubject: Math\\nTopic: Real Numbers\\nClass: HSC\\nLectured by: OnnoRokom Pathshala'},
  {id:'-V74Q81yVBY', title:'05. Superior Lower Limit & Inferior Upper Limit | বৃহত্তম নিম্নসীমা এবং ক্ষুদ্রতম উর্ধ্ব সীমা | OnnoRokom Pathshala', duration:'5:40', desc:'Video Title: OnnoRokom Pathshala_Higher Mathematics\\nLecture: Superior Lower Limit & Inferior Upper Limit\\nSubject: Math\\nTopic: Real Numbers\\nClass: HSC\\nLectured by: OnnoRokom Pathshala'},
];

function videoEntry(v) {
  return `    {
      "id": "${v.id}",
      "title": "${v.title}",
      "duration": "${v.duration}",
      "thumbnail": "https://i.ytimg.com/vi/${v.id}/hqdefault.jpg",
      "channelId": "UCBA6OI6vEDK13jfoiuX694A",
      "channelName": "OnnoRokom Pathshala",
      "description": "${v.desc}"
    }`;
}

const videoEntries = newVideos.map(videoEntry).join(',\n');

// ---------- New playlist entries ----------
const newPlaylists = [
  {
    id: 'Math_Probability',
    title: 'Probability (সম্ভাবনা)',
    videoCount: 15,
    thumbnail: 'https://i.ytimg.com/vi/Y1E14kvsbcU/hqdefault.jpg',
    updatedText: 'Updated 1 week ago',
    videos: ['Y1E14kvsbcU','pOZX7iyimhU','NW8ceI8kjbs','HNevvIfV3cc','_9vTRjgocP0','02XiBx5VHUU','dVeIP7Nz-PQ','xXmfsar-zJ8','IPdD2eInrAs','QM1uKmzudAw','rszcKgvA0jU','__WfAZT_G5s','kziYkArx99s','HJw46kvy-Ik','hSbw629Ry40']
  },
  {
    id: 'Math_MeasuresOfDispersion',
    title: 'Measures of Dispersion (বিস্তার-পরিমাপ)',
    videoCount: 13,
    thumbnail: 'https://i.ytimg.com/vi/L6ZmbdpEjic/hqdefault.jpg',
    updatedText: 'Updated 1 week ago',
    videos: ['L6ZmbdpEjic','BLnYi_bTNm0','IYxSMiyqz94','J84zZfcrVak','2fKam8Ux87g','g2sOV-LNDQQ','vayiusfGVgQ','DQG1c5HoaKw','CJxL3NsTE24','OQnlcwqV_hw','uRz3Rxd4gOA','2CVv0c6-G04','7v5DdYgVyPo']
  },
  {
    id: 'Math_Trigonometry',
    title: 'Trigonometry & Inverse Circular Functions (ত্রিকোণমিতি)',
    videoCount: 10,
    thumbnail: 'https://i.ytimg.com/vi/-S6MTpVx1NA/hqdefault.jpg',
    updatedText: 'Updated 1 week ago',
    videos: ['-S6MTpVx1NA','9MBeuJHYsHI','7vTjP1kMM2k','-f0MwA5ohO4','Wcczdn-c50c','G2OfNM1Cjc8','AJqft5KUScA','gVBXUtHx3GQ','MavaHIhiZKU','WFP3irfLxyI']
  },
  {
    id: 'Math_LinearProgramming',
    title: 'Linear Programming (যোগ্রাশ্রয়ী প্রোগ্রামিং)',
    videoCount: 6,
    thumbnail: 'https://i.ytimg.com/vi/c_u0a4aNxhY/hqdefault.jpg',
    updatedText: 'Updated 1 week ago',
    videos: ['c_u0a4aNxhY','jgdsahRFZtg','BCcEddoZl0w','sdqKJoZD5P4','s3oOGbJQWS4','dbEB89uXhXE']
  },
  {
    id: 'Math_Modulus',
    title: 'Modulus & Real Numbers (মডুলাস ও বাস্তব সংখ্যা)',
    videoCount: 5,
    thumbnail: 'https://i.ytimg.com/vi/FKXKWUI8-L4/hqdefault.jpg',
    updatedText: 'Updated 1 week ago',
    videos: ['FKXKWUI8-L4','Qoy8o96Eaz0','Zg7vVZvmsTU','pQuCu8c5n9s','-V74Q81yVBY']
  }
];

function playlistEntry(p) {
  const videosJs = p.videos.map(v => `        "${v}"`).join(',\n');
  return `{
      "id": "${p.id}",
      "title": "${p.title}",
      "videoCount": ${p.videoCount},
      "thumbnail": "${p.thumbnail}",
      "updatedText": "${p.updatedText}",
      "videos": [
${videosJs}
      ]
    }`;
}

const playlistEntries = newPlaylists.map(playlistEntry).join(',\n');

// ---------- Insert videos ----------
// Find the videos array close: ",\n  ],\n  playlists:"
// The comma after the last video's "}" is what we match; we keep the "}"
const videosMarker = ',\n  ],\n  playlists:';
const videosIdx = content.indexOf(videosMarker);
if (videosIdx === -1) {
  console.error('ERROR: Could not find videos array close marker');
  process.exit(1);
}
// Insert new videos right after the comma that follows the last video's "}"
content = content.replace(
  videosMarker,
  `,\n${videoEntries}\n  ],\n  playlists:`
);

// ---------- Insert playlists ----------
// Find the playlists array close: ",\n  ]\n};"
// The comma after the last playlist's "}" is what we match
const playlistsMarker = ',\n  ]\n};';
const playlistsIdx = content.indexOf(playlistsMarker);
if (playlistsIdx === -1) {
  console.error('ERROR: Could not find playlists array close marker');
  process.exit(1);
}
content = content.replace(
  playlistsMarker,
  `,\n${playlistEntries}\n  ]\n};`
);

fs.writeFileSync(path, content, 'utf8');
console.log('SUCCESS: Added', newVideos.length, 'videos and', newPlaylists.length, 'playlists');
