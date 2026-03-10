import { useEffect, useState } from "react";
import theme from "../../theme";
import { getDriverCommission } from "../services/paymentService";

export default function DriverCommissionPage() {

  const colors = theme.light.colors;
  const spacing = theme.base.spacing;
  const typography = theme.base.typography;
  const radius = theme.base.radius;
  const shadows = theme.base.shadows;

  const [commissionDue,setCommissionDue] = useState(0);
  const [totalTrips,setTotalTrips] = useState(0);
  const [totalCommission,setTotalCommission] = useState(0);
  const [loading,setLoading] = useState(true);

  const driverId = "demo-driver"; // replace with real user id later

  useEffect(()=>{

    async function loadCommission(){

      try{

        const data = await getDriverCommission(driverId);

        setCommissionDue(data.commissionDue || 0);
        setTotalTrips(data.totalTrips || 0);
        setTotalCommission(data.totalCommission || 0);

      }catch(err){

        console.error("Commission load error",err);

      }finally{

        setLoading(false);

      }
    }

    loadCommission();

  },[]);


  if(loading){

    return(
      <div style={{padding:spacing.xxl}}>
        Loading commission dashboard...
      </div>
    )

  }

  return(

    <div
      style={{
        background:colors.background,
        minHeight:"100vh",
        padding:spacing.xxl,
        fontFamily:typography.fontFamily.primary
      }}
    >

      <h1
        style={{
          fontSize:typography.fontSize.h2,
          marginBottom:spacing.xl
        }}
      >
        Driver Commission
      </h1>


      {/* SUMMARY CARDS */}

      <div
        style={{
          display:"flex",
          gap:spacing.lg,
          marginBottom:spacing.xxl
        }}
      >

        <div
          style={{
            background:colors.surface,
            padding:spacing.lg,
            borderRadius:radius.lg,
            boxShadow:shadows.soft,
            border:`1px solid ${colors.border}`,
            width:"240px"
          }}
        >
          <h3>Total Trips</h3>
          <p style={{fontSize:"26px",fontWeight:"700"}}>
            {totalTrips}
          </p>
        </div>


        <div
          style={{
            background:colors.surface,
            padding:spacing.lg,
            borderRadius:radius.lg,
            boxShadow:shadows.soft,
            border:`1px solid ${colors.border}`,
            width:"240px"
          }}
        >
          <h3>Total Commission</h3>
          <p style={{fontSize:"26px",fontWeight:"700"}}>
            ₹{totalCommission}
          </p>
        </div>


        <div
          style={{
            background:colors.surface,
            padding:spacing.lg,
            borderRadius:radius.lg,
            boxShadow:shadows.soft,
            border:`1px solid ${colors.border}`,
            width:"240px"
          }}
        >
          <h3>Commission Due</h3>
          <p
            style={{
              fontSize:"26px",
              fontWeight:"700",
              color:"#dc2626"
            }}
          >
            ₹{commissionDue}
          </p>
        </div>

      </div>


      {/* EXPLANATION */}

      <div
        style={{
          background:colors.surface,
          padding:spacing.lg,
          borderRadius:radius.lg,
          boxShadow:shadows.soft,
          border:`1px solid ${colors.border}`
        }}
      >

        <h2 style={{marginBottom:spacing.md}}>
          How Commission Works
        </h2>

        <p style={{marginBottom:spacing.sm}}>
          Passenger pays the full ride fare.
        </p>

        <p style={{marginBottom:spacing.sm}}>
          Driver receives the full payment amount immediately.
        </p>

        <p style={{marginBottom:spacing.sm}}>
          The platform commission is tracked separately.
        </p>

        <p>
          Drivers pay the accumulated commission at the end of the month.
        </p>

      </div>

    </div>

  )

}