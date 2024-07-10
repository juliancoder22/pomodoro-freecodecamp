import React, { Component } from "react";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import RefreshIcon from "@mui/icons-material/Refresh";

const accurateInterval = (fn: () => void, time: number) => {
  let cancel: () => void;
  let nextAt = new Date().getTime() + time;
  let timeout: NodeJS.Timeout | null = null;

  const wrapper = () => {
    nextAt += time;
    timeout = setTimeout(wrapper, nextAt - new Date().getTime());
    fn();
  };

  cancel = () => clearTimeout(timeout as NodeJS.Timeout);
  timeout = setTimeout(wrapper, nextAt - new Date().getTime());

  return { cancel };
};

interface TimerLengthControlProps {
  title: string;
  titleID: string;
  minID: string;
  addID: string;
  lengthID: string;
  length: number;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

class TimerLengthControl extends Component<TimerLengthControlProps> {
  render() {
    return (
      <div className="length-control">
        <div id={this.props.titleID}>{this.props.title}</div>
        <button
          className="btn-level"
          id={this.props.minID}
          onClick={this.props.onClick}
          value="-"
        >
          <i className="fa fa-arrow-down fa-2x" />
        </button>
        <div className="btn-level" id={this.props.lengthID}>
          {this.props.length}
        </div>
        <button
          className="btn-level"
          id={this.props.addID}
          onClick={this.props.onClick}
          value="+"
        >
          <i className="fa fa-arrow-up fa-2x" />
        </button>
      </div>
    );
  }
}

interface PomodoroTimerState {
  breakLength: number;
  sessionLength: number;
  timerState: "stopped" | "running";
  timerType: "Session" | "Break";
  timer: number;
  intervalID: { cancel: () => void } | null;
  alarmColor: { color: string };
}

class PomodoroTimer extends Component<{}, PomodoroTimerState> {
  audioBeep: HTMLAudioElement | null = null;

  constructor(props: {}) {
    super(props);
    this.state = {
      breakLength: 5,
      sessionLength: 25,
      timerState: "stopped",
      timerType: "Session",
      timer: 1500,
      intervalID: null,
      alarmColor: { color: "white" },
    };
    this.setBreakLength = this.setBreakLength.bind(this);
    this.setSessionLength = this.setSessionLength.bind(this);
    this.lengthControl = this.lengthControl.bind(this);
    this.timerControl = this.timerControl.bind(this);
    this.beginCountDown = this.beginCountDown.bind(this);
    this.decrementTimer = this.decrementTimer.bind(this);
    this.phaseControl = this.phaseControl.bind(this);
    this.warning = this.warning.bind(this);
    this.buzzer = this.buzzer.bind(this);
    this.switchTimer = this.switchTimer.bind(this);
    this.clockify = this.clockify.bind(this);
    this.reset = this.reset.bind(this);
  }

  setBreakLength(e: React.MouseEvent<HTMLButtonElement>) {
    this.lengthControl(
      "breakLength",
      e.currentTarget.value,
      this.state.breakLength,
      "Session"
    );
  }

  setSessionLength(e: React.MouseEvent<HTMLButtonElement>) {
    this.lengthControl(
      "sessionLength",
      e.currentTarget.value,
      this.state.sessionLength,
      "Break"
    );
  }

  lengthControl(
    stateToChange: "breakLength" | "sessionLength",
    sign: string,
    currentLength: number,
    timerType: "Session" | "Break"
  ) {
    if (this.state.timerState === "running") {
      return;
    }
    if (this.state.timerType === timerType) {
      if (sign === "-" && currentLength !== 1) {
        this.setState({ [stateToChange]: currentLength - 1 } as any);
      } else if (sign === "+" && currentLength !== 60) {
        this.setState({ [stateToChange]: currentLength + 1 } as any);
      }
    } else if (sign === "-" && currentLength !== 1) {
      this.setState({
        [stateToChange]: currentLength - 1,
        timer: currentLength * 60 - 60,
      } as any);
    } else if (sign === "+" && currentLength !== 60) {
      this.setState({
        [stateToChange]: currentLength + 1,
        timer: currentLength * 60 + 60,
      } as any);
    }
  }

  timerControl() {
    if (this.state.timerState === "stopped") {
      this.beginCountDown();
      this.setState({ timerState: "running" });
    } else {
      this.setState({ timerState: "stopped" });
      if (this.state.intervalID) {
        this.state.intervalID.cancel();
      }
    }
  }

  beginCountDown() {
    this.setState({
      intervalID: accurateInterval(() => {
        this.decrementTimer();
        this.phaseControl();
      }, 1000),
    });
  }

  decrementTimer() {
    this.setState({ timer: this.state.timer - 1 });
  }

  phaseControl() {
    let timer = this.state.timer;
    this.warning(timer);
    this.buzzer(timer);
    if (timer < 0) {
      if (this.state.intervalID) {
        this.state.intervalID.cancel();
      }
      if (this.state.timerType === "Session") {
        this.beginCountDown();
        this.switchTimer(this.state.breakLength * 60, "Break");
      } else {
        this.beginCountDown();
        this.switchTimer(this.state.sessionLength * 60, "Session");
      }
    }
  }

  warning(_timer: number) {
    if (_timer < 61) {
      this.setState({ alarmColor: { color: "#a50d0d" } });
    } else {
      this.setState({ alarmColor: { color: "white" } });
    }
  }

  buzzer(_timer: number) {
    if (_timer === 0 && this.audioBeep) {
      this.audioBeep.play();
    }
  }

  switchTimer(num: number, str: "Session" | "Break") {
    this.setState({
      timer: num,
      timerType: str,
      alarmColor: { color: "white" },
    });
  }

  clockify() {
    if (this.state.timer < 0) return "00:00";
    let minutes: number = Math.floor(this.state.timer / 60);
    let seconds: number = this.state.timer - minutes * 60;
    let minutesString: string =
      minutes < 10 ? "0" + minutes : minutes.toString();
    let secondsString: string =
      seconds < 10 ? "0" + seconds : seconds.toString();
    return minutesString + ":" + secondsString;
  }

  reset() {
    this.setState({
      breakLength: 5,
      sessionLength: 25,
      timerState: "stopped",
      timerType: "Session",
      timer: 1500,
      intervalID: null,
      alarmColor: { color: "white" },
    });
    if (this.state.intervalID) {
      this.state.intervalID.cancel();
    }
    if (this.audioBeep) {
      this.audioBeep.pause();
      this.audioBeep.currentTime = 0;
    }
  }

  render() {
    return (
      <div>
        <div className="main-title">25 + 5 Clock</div>
        <TimerLengthControl
          addID="break-increment"
          length={this.state.breakLength}
          lengthID="break-length"
          minID="break-decrement"
          onClick={this.setBreakLength}
          title="Break Length"
          titleID="break-label"
        />
        <TimerLengthControl
          addID="session-increment"
          length={this.state.sessionLength}
          lengthID="session-length"
          minID="session-decrement"
          onClick={this.setSessionLength}
          title="Session Length"
          titleID="session-label"
        />
        <div className="timer" style={this.state.alarmColor}>
          <div className="timer-wrapper">
            <div id="timer-label">{this.state.timerType}</div>
            <div id="time-left">{this.clockify()}</div>
          </div>
        </div>
        <div className="timer-control">
          <button id="start_stop" onClick={this.timerControl}>
            {this.state.timerState === "running" ? (
              <PauseIcon fontSize="large" />
            ) : (
              <PlayArrowIcon fontSize="large" />
            )}
          </button>
          <button id="reset" onClick={this.reset}>
            <RefreshIcon fontSize="large" />
          </button>
        </div>
        <audio
          id="beep"
          preload="auto"
          ref={(audio) => {
            this.audioBeep = audio;
          }}
          src="https://raw.githubusercontent.com/freeCodeCamp/cdn/master/build/testable-projects-fcc/audio/BeepSound.wav"
        />
      </div>
    );
  }
}

export default PomodoroTimer;
