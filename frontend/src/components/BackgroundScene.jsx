function BackgroundScene() {
  return (
    <div className="background-scene" aria-hidden="true">
      <div className="background-scene__grid" />
      <div className="background-scene__orb background-scene__orb--one" />
      <div className="background-scene__orb background-scene__orb--two" />
      <div className="background-scene__orb background-scene__orb--three" />
      <div className="background-scene__ring background-scene__ring--one" />
      <div className="background-scene__ring background-scene__ring--two" />
      <div className="background-scene__mesh">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

export default BackgroundScene;
