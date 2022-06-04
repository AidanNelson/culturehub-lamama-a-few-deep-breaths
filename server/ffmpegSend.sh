ffmpeg \
	-re \
	-stream_loop -1 \
	-i testvid.mp4 \
    -an \
    -map 0:v:0 \
    -pix_fmt yuv420p -c:v libvpx -b:v 1000k -deadline realtime -cpu-used 4 \
    -f tee \
	"[select=v:f=rtp:ssrc=2222:payload_type=101]rtp://172.31.74.40:40413?rtcpport=41654"

# ffmpeg \
#     -re \
#     -stream_loop -1 \
#     -i testvid.mp4 \
#     -an \
#     -pix_fmt yuv420p \
#     -c:v libvpx -b:v 1000k -deadline realtime \
#     -f rtp \
#     -sdp_file video.sdp \
#     "rtp://172.31.74.40:43965"


# ffmpeg -re \
#   -i testvid.mp4 \
#   -v info \
#   -codec copy \
#   -bsf:v h264_mp4toannexb -an -deadline realtime \
#   -map 0:v:0 \
#   -f tee \
#   "[select=v:f=rtp:ssrc=${VIDEO_SSRC}:payload_type=${VIDEO_PT}]rtp://127.0.0.1:${videoRtpPort}?rtcpport=${videoRtcpPort}"