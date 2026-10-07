import { useState, useEffect } from 'react'
import './App.css'
import preguntas from '../data/preguntas.json' 

const decode = (html) => {
  const t = document.createElement('textarea')
  t.innerHTML = html
  return t.value
}

const loadScores = () =>
  JSON.parse(localStorage.getItem('scores') || '[]').sort((a, b) => b.score - a.score)

const medals = ['🥇', '🥈', '🥉']

function RankingList({ ranking }) {
  if (ranking.length === 0) return null
  return (
    <div className="ranking">
      <h2>🏅 Ranking</h2>
      <ol>
        {ranking.slice(0, 10).map(({ name, score }, index) => (
          <li key={index}>
            <span className="pos">{medals[index] ?? index + 1}</span>
            <span className="name">{name}</span>
            <span className="pts">{score}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function App() {
  const [quizStarted, setQuizStarted] = useState(false)
  const [finished, setFinished] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [score, setScore] = useState(0)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30) // tiempo inicial en segundos
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(null)
  const [ranking, setRanking] = useState(loadScores)
  const [playerName, setPlayerName] = useState('')
  const [saved, setSaved] = useState(false)

  const fetchQuestions = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = preguntas
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('sin resultados')
      }
      setQuestions(data)
      setCurrentQuestion(0)
      setScore(0)
      setSelected(null)
    } catch {
      setError('Error al cargar las preguntas')
    } finally {
      setLoading(false)
    }
  }

  const respuestas = questions[currentQuestion]
    ? [...questions[currentQuestion].opciones, questions[currentQuestion].respuestaCorrecta].sort()
    : []
  
  const saveScore = () => {
    const name = playerName.trim()
    if (!name || saved) return
    const scores = JSON.parse(localStorage.getItem('scores') || '[]')
    scores.push({ name, score })
    localStorage.setItem('scores', JSON.stringify(scores))
    setRanking(loadScores())
    setSaved(true)
  }
  const startQuiz = () => {
    setFinished(false)
    setRanking(loadScores())
    setPlayerName('')
    setSaved(false)
    setQuestions([])
    setQuizStarted(true)
    setTimeLeft(30) // reiniciar el tiempo al comenzar el quiz
    fetchQuestions()
  }

  const handleAnswer = (option) => {
    if (selected !== null) return
    setSelected(option)
    if (option === questions[currentQuestion].respuestaCorrecta) {
      setScore((s) => s + timeLeft)
    }
  }

  // efecto para el temporizador
  useEffect(() => {
    if (!quizStarted) return
    if(selected !== null) return
    if (questions.length === 0) return
    if (timeLeft === 0) return
    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [quizStarted, timeLeft, selected, questions.length])
  // efecto para reiniciar el tiempo al cambiar de pregunta
  useEffect(() => {
    setTimeLeft(30)
  }, [currentQuestion])

  // efecto para finalizar el quiz cuando se acaba el tiempo
  useEffect(() => {
    if (timeLeft === 0 && quizStarted) {
      handleNext()
    }
  }, [timeLeft, quizStarted])

  const handleNext = () => {
    const next = currentQuestion + 1
    setSelected(null)
    if (next < questions.length) {
      setCurrentQuestion(next)
    } else {
      setQuizStarted(false)
      setFinished(true)
    }
  }

  
  return (
    <main className="app">
      <div className="card">
        {!quizStarted ? (
          <div className="center">
            <div className="emoji">{finished ? '🏆' : '🧠'}</div>
            {finished ? (
              <>
                <h1>¡Quiz terminado!</h1>
                <p className="final-score">{score} pts</p>
                {saved ? (
                  <p className="saved">✅ ¡Puntaje guardado!</p>
                ) : (
                  <div className="save-form">
                    <input
                      type="text"
                      placeholder="Tu nombre"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveScore()}
                    />
                    <button className="primary" onClick={saveScore}>Guardar</button>
                  </div>
                )}
                <RankingList ranking={ranking} />
                <button className="primary" onClick={startQuiz}>Jugar de nuevo</button>
                <button className="primary" onClick={() => setFinished(false)}>Volver al inicio</button>
              </>
            ) : (
              <>
                <h1>Bienvenido a la Quiz App</h1>
                <p className="subtitle">Prueba tus conocimientos con nuestros cuestionarios interactivos.</p>
                <RankingList ranking={ranking} />
                <button className="primary" onClick={startQuiz}>Comenzar Quiz</button>
              </>
            )}
          </div>
        ) : (
          <>
            <div className={`timer ${timeLeft <= 10 ? 'danger' : ''}`}>⏱ {timeLeft}s</div>
            <header className="topbar">
              <span className="badge">
                {questions.length > 0 ? `Pregunta ${currentQuestion + 1} / ${questions.length}` : 'Quiz'}
              </span>
              <span className="badge score">⭐ {score}</span>
            </header>
            {questions.length > 0 && (
              <div className="progress">
                <div
                  className="progress-bar"
                  style={{ width: `${((currentQuestion + (selected !== null ? 1 : 0)) / questions.length) * 100}%` }}
                />
              </div>
            )}
            {loading && <p className="status">Cargando preguntas...</p>}
            {error && <p className="status error">{error}</p>}
            {question && (
              <>
                <h2 className="question">{decode(question.question)}</h2>
                <div className="options">
                  {options.map((option) => (
                    <button
                      key={option}
                      className={optionClass(option)}
                      disabled={selected !== null}
                      onClick={() => handleAnswer(option)}
                    >
                      <span>{decode(option)}</span>
                      {selected !== null && option === question.correct_answer && <b>✓</b>}
                      {selected !== null && option === selected && option !== question.correct_answer && <b>✗</b>}
                    </button>
                  ))}
                </div>
                {selected !== null && (
                  <button className="primary next" onClick={handleNext}>
                    {currentQuestion + 1 < questions.length ? 'Siguiente →' : 'Ver resultado'}
                  </button>
                )}
              </>
            )}
            <button className="ghost" onClick={() => setQuizStarted(false)}>Reiniciar Quiz</button>
          </>
        )}
      </div>
    </main>
  )
}

export default App
