
const CssRobot = () => {
    return (
        <>
            <style>{`
                .cb-container {
                    cursor: pointer;
                    transition: transform 0.3s ease;
                    position: relative;
                }
                .cb-container:hover {
                    box-shadow: none; /* Override any potential default shadow */
                }

                .cb-robot {
                    position: relative;
                    animation: cb-float 3s ease-in-out infinite;
                }

                .cb-head {
                    width: 70px;
                    height: 48px;
                    background: #f0f0f0; /* White/Light Grey */
                    border-radius: 50% / 60% 60% 40% 40%; /* Oblong shape */
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    position: relative;
                    z-index: 10;
                    box-shadow: inset -2px -2px 6px rgba(0,0,0,0.1);
                }

                /* Visor (Black face area) */
                .cb-visor {
                    width: 58px;
                    height: 28px;
                    background: #222;
                    border-radius: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0 12px;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 1px 2px rgba(255,255,255,0.2);
                }
                
                /* Glass Reflection on Visor */
                .cb-visor::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    right: 10px;
                    width: 20px;
                    height: 100%;
                    background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 60%);
                    transform: skewX(-20deg);
                }

                /* Eyes */
                .cb-eye {
                    width: 6px;
                    height: 14px;
                    background: #00bcd4; /* Cyan/Teal */
                    border-radius: 3px;
                    animation: cb-blink 4s infinite;
                    box-shadow: 0 0 4px #00bcd4;
                }

                /* Body */
                .cb-body {
                    width: 44px;
                    height: 38px;
                    background: #f0f0f0;
                    border-radius: 10px 10px 22px 22px; /* Cup/Bowl shape */
                    margin: -5px auto 0; /* Tuck under head */
                    position: relative;
                    z-index: 5;
                    box-shadow: inset -2px -2px 5px rgba(0,0,0,0.05);
                }

                /* Arms */
                .cb-arm-left {
                    width: 14px;
                    height: 30px;
                    background: #f0f0f0;
                    border-radius: 50% 50% 40% 40% / 60% 60% 40% 40%; /* Slightly organic, tapered */
                    position: absolute;
                    top: 55px; 
                    left: -4px; 
                    transform: rotate(15deg) skewX(2deg); /* Skew helps create a slight visual bend */
                    box-shadow: inset -1px -1px 4px rgba(0,0,0,0.1); 
                    z-index: 4;
                }

                .cb-arm-right {
                    width: 14px;
                    height: 30px;
                    background: #f0f0f0;
                    border-radius: 40% 60% 60% 40% / 40% 60% 60% 40%; /* Organic curved shape */
                    position: absolute;
                    top: 35px; /* Raised higher for proper wave */
                    right: -8px;
                    transform-origin: bottom left;
                    box-shadow: inset -1px -1px 4px rgba(0,0,0,0.1);
                    z-index: 4;
                    animation: cb-wave 1.5s ease-in-out infinite;
                }

                /* Shadow */
                .cb-shadow {
                    width: 40px;
                    height: 8px;
                    background: rgba(0, 0, 0, 0.4);
                    border-radius: 50%;
                    margin: 8px auto 0;
                    animation: cb-shadow 3s ease-in-out infinite;
                }

                /* Animations - Renamed to avoid conflicts */
                @keyframes cb-float {
                    0% { transform: translateY(0); }
                    50% { transform: translateY(-7px); }
                    100% { transform: translateY(0); }
                }

                @keyframes cb-wave {
                    0%, 100% { transform: rotate(-15deg) skewX(-3deg); }
                    25% { transform: rotate(-35deg) skewX(-5deg); }
                    50% { transform: rotate(-15deg) skewX(-3deg); }
                    75% { transform: rotate(-35deg) skewX(-5deg); }
                }

                @keyframes cb-blink {
                    0%, 90%, 100% { transform: scaleY(1); }
                    95% { transform: scaleY(0.1); }
                }

                @keyframes cb-shadow {
                    0% { transform: scale(1); opacity: 0.25; }
                    50% { transform: scale(0.7); opacity: 0.15; }
                    100% { transform: scale(1); opacity: 0.25; }
                }
            `}</style>

            <div className="cb-container">
                <div className="cb-robot">
                    <div className="cb-head">
                        <div className="cb-visor">
                            <span className="cb-eye" />
                            <span className="cb-eye" />
                        </div>
                    </div>

                    <div className="cb-arm-left" />
                    <div className="cb-arm-right" />

                    <div className="cb-body" />
                    <div className="cb-shadow" />
                </div>
            </div>
        </>
    );
};

export default CssRobot;
