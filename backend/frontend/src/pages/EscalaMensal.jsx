function EscalaMensal() {

  const escala = [];

  for (let dia = 1; dia <= 30; dia++) {

    const bombeiro = ((dia - 1) % 12) + 1;

    escala.push({
      dia,
      bombeiro: `Bombeiro ${String(bombeiro).padStart(2, "0")}`
    });
  }

  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        textAlign: "center"
      }}
    >
      <h1>Escala Mensal</h1>

      <table
        style={{
          margin: "0 auto",
          borderCollapse: "collapse",
          width: "100%"
        }}
      >
        <thead>
          <tr>
            <th>Dia</th>
            <th>Bombeiro Escalado</th>
          </tr>
        </thead>

        <tbody>
          {escala.map((item) => (
            <tr key={item.dia}>
              <td>{item.dia}</td>
              <td>{item.bombeiro}</td>
            </tr>
          ))}
        </tbody>

      </table>
    </div>
  );
}

export default EscalaMensal;