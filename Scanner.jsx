import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api";
import QRScanner from "../../components/Scanner/QRScanner";

function calcDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (x) => (x * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function StudentScanner({ publicMode = false }) {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { token: tokenParam } = useParams();
  const location = useLocation();

  const [rollNumber, setRollNumber] = useState("");
  const [studentName, setStudentName] = useState("");
  const [geoStatus, setGeoStatus] = useState("Checking location...");
  const [withinRange, setWithinRange] = useState(true);

  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [manualToken, setManualToken] = useState("");

  useEffect(() => {
    if (publicMode && !authLoading) {
      if (!user || user.role !== "student") {
        const nextPath = tokenParam ? `/scan/${tokenParam}` : location.pathname + location.search;
        navigate(`/login?next=${encodeURIComponent(nextPath)}`, { replace: true });
        return;
      }
    }

    const stored = localStorage.getItem("student_roll");

    if (stored) {
      setRollNumber(stored);
    } else if (user?.username) {
      setRollNumber(user.username.toUpperCase());
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const TEACHER_LAT = 12.9716;
          const TEACHER_LON = 77.5946;

          const distance = calcDistance(
            pos.coords.latitude,
            pos.coords.longitude,
            TEACHER_LAT,
            TEACHER_LON
          );

          setGeoStatus(`Distance : ${Math.round(distance)} m`);

          // Demo
          setWithinRange(true);

          // Real project
          // setWithinRange(distance <= 50);
        },
        () => {
          setGeoStatus("Location unavailable");
          setWithinRange(true);
        }
      );
    }
  }, [user, authLoading, publicMode, tokenParam, location.pathname, location.search, navigate]);

  useEffect(() => {
    if (tokenParam) {
      setManualToken(tokenParam);
    }
  }, [tokenParam]);

  const handleScan = async (token) => {
    if (!rollNumber.trim()) {
      throw new Error("Enter Roll Number");
    }

    if (!withinRange) {
      throw new Error("Outside Classroom");
    }

    setSubmitting(true);

    try {
      const response = await api.post("/attendance/scan/", {
        token: token,
        roll_number: rollNumber.trim(),
        name: studentName.trim(),
      });

      localStorage.setItem("student_roll", rollNumber.trim());

      setMessage(response.data.message);
      setManualToken("");

      return response.data;
    } catch (err) {
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualToken.trim()) {
      setMessage("Enter the token shown by the teacher.");
      return;
    }

    try {
      await handleScan(manualToken.trim());
    } catch (err) {
      setMessage(err?.response?.data?.message || "Unable to mark attendance with this token.");
    }
  };

  return (
    <div className="dashboard-page">

      <h1>Student QR Scanner</h1>

      <div className="glass-card" style={{ padding: 20 }}>

        <label>Roll Number</label>

        <input
          className="form-input"
          value={rollNumber}
          onChange={(e) => {
            setRollNumber(e.target.value.toUpperCase());
          }}
        />

        <br />
        <br />

        <label>Student Name</label>
        <input
          className="form-input"
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          placeholder="Enter your full name"
        />

        <br />
        <br />

        <p>{geoStatus}</p>

        <QRScanner onScan={handleScan} />

        <br />

        <form onSubmit={handleManualSubmit} style={{ marginTop: 16, padding: 14, border: '1px solid rgba(255,255,255,0.14)', borderRadius: 12, background: 'rgba(255,255,255,0.04)' }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>If QR scan fails, paste the token manually</label>
          <textarea
            className="form-input"
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            placeholder="Paste the teacher's token here"
            rows={3}
            style={{ minHeight: 80, resize: 'vertical' }}
          />
          <button className="btn btn-primary" type="submit" style={{ marginTop: 10 }}>
            Submit Token
          </button>
        </form>

        <br />

        {submitting && <p>Scanning...</p>}

        {message && (
          <div
            style={{
              color: "green",
              fontWeight: "bold",
              marginTop: 15,
            }}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}