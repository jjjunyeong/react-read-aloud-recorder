import React, { useState, useEffect } from "react";
import { collection, getDocs, query, where, doc, updateDoc } from "firebase/firestore";
import { db, storage } from "./firebase"; // Import Firestore and Storage instance
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

function App() {
    const [username, setUsername] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [error, setError] = useState("");
    const [sentences, setSentences] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [recordText, setRecordText] = useState("");
    const [isRecording, setIsRecording] = useState(false);
    const [audioURL, setAudioURL] = useState(null);
    const [isSentenceRecorded, setIsSentenceRecorded] = useState(false);
    const [isAudioPlayed, setIsAudioPlayed] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [mediaStream, setMediaStream] = useState(null);
    const [totalSentences, setTotalSentences] = useState(0);
    const [completedSentences, setCompletedSentences] = useState(0);

    const handleLogin = async () => {
        try {
            const usersCollection = collection(db, "users");
            const querySnapshot = await getDocs(usersCollection);
            const usernames = querySnapshot.docs.map(doc => doc.id);

            if (usernames.includes(username)) {
                setIsAuthenticated(true);
                fetchSentences(username);
            } else {
                setError("Username does not exist. Please contact the admin.");
            }
        } catch (err) {
            console.error("Error fetching usernames:", err);
            setError("An error occurred while logging in. Please try again.");
        }
    };

    const fetchSentences = async (username) => {
        try {
            const sentencesRef = collection(db, `users/${username}/sentences`);
            const allSentencesSnapshot = await getDocs(sentencesRef);
            const allSentences = allSentencesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTotalSentences(allSentences.length); // Total number of sentences

            const q = query(sentencesRef, where("recorded", "==", false));
            const querySnapshot = await getDocs(q);
            const fetchedSentences = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSentences(fetchedSentences);
            setRecordText(fetchedSentences[0]?.text || "");
            setCompletedSentences(allSentences.length - fetchedSentences.length); // Initialize completed count
        } catch (err) {
            console.error("Error fetching sentences:", err);
            setError("An error occurred while fetching sentences.");
        }
    };

    const toggleRecording = async () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const startRecording = async () => {
        setIsRecording(true);
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMediaStream(stream);
        const recorder = new MediaRecorder(stream);
        const chunks = [];

        recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                chunks.push(event.data);
            }
        };

        recorder.onstop = async () => {
            const blob = new Blob(chunks, { type: "audio/wav" });
            const audioFileName = `recording_${sentences[currentIndex].id}.mp3`; // TODO: change this with document name(now it's rewriting everytime..)
            const storageRef = ref(storage, `users/${username}/${audioFileName}`);

            // Upload to Firebase Storage
            await uploadBytes(storageRef, blob);
            const downloadURL = await getDownloadURL(storageRef);
            setAudioURL(downloadURL);

            setIsSentenceRecorded(true);
            setIsAudioPlayed(false); // Reset audio played state
        };

        recorder.start();
        setMediaRecorder(recorder);
    };

    const stopRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.stop();
        }
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
        }
        setIsRecording(false);
    };

    const handleNextSentence = async () => {
        if (!isSentenceRecorded || !isAudioPlayed) return;

        try {
            // Ensure audioURL is available
            if (!audioURL) {
                console.error("No audio URL available to save.");
                return;
            }

            // Update the current sentence in Firestore with new field "saved_url"
            const sentenceDoc = doc(db, `users/${username}/sentences/${sentences[currentIndex].id}`);
            await updateDoc(sentenceDoc, { recorded: true, text: recordText, saved_url: audioURL });

            // Move to the next sentence
            const nextIndex = currentIndex + 1;
            setCompletedSentences(prev => prev + 1); // Increment completed count

            if (nextIndex < sentences.length) {
                setCurrentIndex(nextIndex);
                setRecordText(sentences[nextIndex]?.text || "");
                setAudioURL(null);
                setIsSentenceRecorded(false);
                setIsAudioPlayed(false);
            } else {
                // Show a message when no more sentences are available
                setRecordText("No more sentences to record");
                setSentences([]); // Clear the sentences to prevent further actions
            }
        } catch (error) {
            console.error("Error updating Firestore:", error);
            setError("Failed to update the sentence. Please try again.");
        }
    };

    if (!isAuthenticated) {
        return (
            <div style={{ fontFamily: "Arial, sans-serif", textAlign: "center", padding: "20px" }}>
                <h1>Login</h1>
                <input
                    type="text"
                    placeholder="Enter your name"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={{ padding: "10px", fontSize: "16px", margin: "10px 0", width: "80%" }}
                />
                <br />
                <button
                    onClick={handleLogin}
                    style={{ padding: "10px 20px", fontSize: "16px", cursor: "pointer" }}
                >
                    Login
                </button>
                {error && <p style={{ color: "red" }}>{error}</p>}
            </div>
        );
    }

    if (sentences.length === 0) {
        return (
            <div style={{ fontFamily: "Arial, sans-serif", textAlign: "center", padding: "20px" }}>
                <h1>No More Sentences to Record</h1>
            </div>
        );
    }

    return (
        <div style={{ fontFamily: "Arial, sans-serif", textAlign: "center", padding: "20px" }}>
            <h1>Voice Recorder</h1>

            <h2>Read and Record this Sentence</h2>
            <textarea
                value={recordText}
                onChange={(e) => setRecordText(e.target.value)}
                style={{ width: "80%", padding: "10px", fontSize: "16px", margin: "10px 0" }}
            ></textarea>

            <p>Progress: {completedSentences}/{totalSentences} Recorded</p>

            <br />

            <button
                onClick={toggleRecording}
                style={{ padding: "10px 20px", fontSize: "16px", cursor: "pointer", marginRight: "10px" }}
            >
                {isRecording ? "Stop Recording" : "Start Recording"}
            </button>

            <button
                onClick={handleNextSentence}
                style={{ padding: "10px 20px", fontSize: "16px", cursor: isSentenceRecorded && isAudioPlayed ? "pointer" : "not-allowed" }}
                disabled={!isSentenceRecorded || !isAudioPlayed}
            >
                Next Sentence
            </button>

            

            {audioURL && (
                <div style={{ marginTop: "20px" }}>
                    <h2>Recorded Audio:</h2>
                    <audio
                        controls
                        src={audioURL}
                        onPlay={() => setIsAudioPlayed(true)}
                    ></audio>
                </div>
            )}
        </div>
    );
}

export default App;
