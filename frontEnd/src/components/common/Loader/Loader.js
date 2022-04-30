import React from "react";
import PulseLoader from "react-spinners/PulseLoader";

export const suspenseFallbackLoader = () => {
  return (
      <div style={{marginTop: "18%", marginLeft:"45%", position:"fixed"}}>
          <PulseLoader color={"#36D7B7"} loading={true}  size={50} color={"#FF8B47"}/>
      </div>
  )
};