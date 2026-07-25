export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#F8FAFC",
      }}
    >
      <div
        style={{
          textAlign: "center",
          padding: "40px",
          borderRadius: "20px",
          background: "white",
          boxShadow: "0 10px 30px rgba(0,0,0,.08)",
        }}
      >
        <h1
          style={{
            fontSize: "42px",
            marginBottom: "10px",
          }}
        >
          🏠 Apê 13-01
        </h1>

        <p
          style={{
            color: "#666",
            fontSize: "18px",
          }}
        >
          Bem-vindo ao nosso novo lar ❤️
        </p>
      </div>
    </main>
  );
}